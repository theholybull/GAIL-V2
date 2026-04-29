# import ensurepip
import atexit
import gc
import importlib
import inspect
import pkgutil
import platform
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
import typing
from pathlib import Path

import bpy

if typing.TYPE_CHECKING:
    from types import ModuleType

PACKAGE_DIR = Path(__file__).absolute().parent
REQUIREMENTS_FILE = PACKAGE_DIR / "requirements.txt"

__all__ = (
    "init",
    "register",
    "unregister",
)

blender_version = bpy.app.version
is_win = platform.system() == "Windows"

modules: list["ModuleType"] | None = None
bin_modules: list[Path] | None = None
ordered_classes: list[type] | None = None


def init() -> None:
    """Install packages, discover modules and classes."""
    install_requirements()
    put_bin_modules(PACKAGE_DIR)

    global modules
    global ordered_classes

    modules = get_all_submodules(PACKAGE_DIR)
    ordered_classes = get_ordered_classes_to_register(modules)


def register() -> None:
    """Register classes and modules."""
    assert modules is not None, "Modules are not discovered"
    assert ordered_classes is not None, "Classes are not discovered"

    for cls in ordered_classes:
        try:
            bpy.utils.register_class(cls)
        except Exception as e:
            print(f"Failed to register class: `{cls.__name__}`", file=sys.stderr)
            raise e
    print(f"Registered {len(ordered_classes)} classes of AnimoXtend")

    to_register_modules = [m for m in modules if m.__name__ != __name__ and hasattr(m, "register")]
    for m in to_register_modules:
        m.register()
    print(f"Registered {len(to_register_modules)} modules of AnimoXtend")


def unregister() -> None:
    """Unregister classes and modules."""
    assert ordered_classes is not None, "Classes are not registered"
    assert modules is not None, "Modules are not registered"

    for cls in reversed(ordered_classes):
        try:
            bpy.utils.unregister_class(cls)
        except Exception:
            print(f"Failed to unregister class `{cls.__name__}`")
            continue

    to_unregister_modules = [m for m in modules if m.__name__ != __name__ and hasattr(m, "unregister")]
    for m in to_unregister_modules:
        m.unregister()

    gc.collect()
    time.sleep(0.2)  # Wait for the garbage collector to finish
    remove_bin_modules()


#################################################
# Import requirements
#################################################


def install_requirements() -> None:
    """Install required packages."""
    cmd = [sys.executable, "-m", "pip", "install"]
    try:
        if bpy.app.translations.locale.startswith("zh_HANS"):
            # Use mirror for zh_HANS users
            cmd += [
                "--index-url",
                "http://mirrors.aliyun.com/pypi/simple/",
                "--trusted-host",
                "mirrors.aliyun.com",
            ]
    except Exception:
        pass
    cmd += ["-r", REQUIREMENTS_FILE.as_posix()]
    print(f"Installing packages:\n    > {shlex.join(cmd)}")
    try:
        # ensurepip.bootstrap()
        subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as e:
        print("Error installing packages:", file=sys.stderr)
        print(e.stderr.decode(), file=sys.stderr)
        traceback.print_exc()


#################################################
# Import modules
#################################################


def get_all_submodules(directory):
    return list(iter_submodules(directory, __package__))


def iter_submodules(path, package_name):
    for name in sorted(iter_submodule_names(path)):
        yield importlib.import_module("." + name, package_name)


def iter_submodule_names(path, root=""):
    for _, module_name, is_package in pkgutil.iter_modules([str(path)]):
        if is_package:
            sub_path = path / module_name
            sub_root = root + module_name + "."
            yield from iter_submodule_names(sub_path, sub_root)
        else:
            yield root + module_name


#################################################
# Find classes to register
#################################################


def get_ordered_classes_to_register(modules):
    return toposort(get_register_deps_dict(modules))


def get_register_deps_dict(modules):
    my_classes = set(iter_my_classes(modules))
    my_classes_by_idname = {cls.bl_idname: cls for cls in my_classes if hasattr(cls, "bl_idname")}

    deps_dict = {}
    for cls in my_classes:
        deps_dict[cls] = set(iter_my_register_deps(cls, my_classes, my_classes_by_idname))
    return deps_dict


def iter_my_register_deps(cls, my_classes, my_classes_by_idname):
    yield from iter_my_deps_from_annotations(cls, my_classes)
    yield from iter_my_deps_from_parent_id(cls, my_classes_by_idname)


def iter_my_deps_from_annotations(cls, my_classes):
    for value in typing.get_type_hints(cls, {}, {}).values():
        dependency = get_dependency_from_annotation(value)
        if dependency is not None:
            if dependency in my_classes:
                yield dependency


def get_dependency_from_annotation(value):
    if blender_version >= (2, 93):
        if isinstance(value, bpy.props._PropertyDeferred):  # type: ignore
            return value.keywords.get("type")
    elif isinstance(value, tuple) and len(value) == 2:
        if value[0] in (bpy.props.PointerProperty, bpy.props.CollectionProperty):
            return value[1]["type"]
    return None


def iter_my_deps_from_parent_id(cls, my_classes_by_idname):
    if issubclass(cls, bpy.types.Panel):
        parent_idname = getattr(cls, "bl_parent_id", None)
        if parent_idname is not None:
            parent_cls = my_classes_by_idname.get(parent_idname)
            if parent_cls is not None:
                yield parent_cls


def iter_my_classes(modules):
    base_types = get_register_base_types()
    for cls in get_classes_in_modules(modules):
        if any(issubclass(cls, base) for base in base_types):
            if inspect.isabstract(cls):
                continue
            if getattr(cls, "is_registered", False):
                continue
            yield cls


def get_classes_in_modules(modules):
    classes = set()
    for module in modules:
        for cls in iter_classes_in_module(module):
            classes.add(cls)
    return classes


def iter_classes_in_module(module):
    for value in module.__dict__.values():
        if inspect.isclass(value):
            yield value


def get_register_base_types():
    return set(
        getattr(bpy.types, name)
        for name in (
            "Panel",
            "Operator",
            "PropertyGroup",
            "AddonPreferences",
            "Header",
            "Menu",
            "Node",
            "NodeSocket",
            "NodeTree",
            "UIList",
            "RenderEngine",
            "Gizmo",
            "GizmoGroup",
        )
    )


#################################################
# Find order to register to solve dependencies
#################################################


def toposort(deps_dict):
    sorted_list = []
    sorted_values = set()
    while len(deps_dict) > 0:
        unsorted = []
        sorted_list_sub = []  # helper for additional sorting by bl_order - in panels
        for value, deps in deps_dict.items():
            if len(deps) == 0:
                sorted_list_sub.append(value)
                sorted_values.add(value)
            else:
                unsorted.append(value)
        deps_dict = {value: deps_dict[value] - sorted_values for value in unsorted}
        sorted_list_sub.sort(key=lambda cls: getattr(cls, "bl_order", 0))
        sorted_list.extend(sorted_list_sub)
    return sorted_list


#################################################
# Handle pyd modules
#################################################


def put_bin_modules(root: Path):
    global bin_modules

    if not is_win:
        bin_modules = None
        return

    bin_modules = []
    for p in root.rglob("._*.pyd"):
        src = p.absolute()
        dst = src.parent / src.name[2:]
        if dst.exists():
            dst.unlink()
        shutil.copyfile(src, dst)
        print(f"[AnimoXtend] Copied bin module: {dst.stem}")
        bin_modules.append(dst)


def remove_bin_modules():
    global bin_modules

    if bin_modules:
        temp_d = tempfile.mkdtemp()
        for src in bin_modules:
            dst = Path(temp_d) / src.name
            shutil.move(src, dst)

        def _rm_temp_d():
            try:
                shutil.rmtree(temp_d)
            except Exception:
                print(
                    f"[AnimoXtend] Failed to remove temp directory of bin modules: {temp_d}",
                    file=sys.stderr,
                )
                traceback.print_exc()

        atexit.register(_rm_temp_d)

    bin_modules = None
