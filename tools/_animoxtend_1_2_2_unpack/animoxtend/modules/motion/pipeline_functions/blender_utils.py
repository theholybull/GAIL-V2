import bpy

# import ensurepip
# import subprocess
# import sys

# REQUIRED_PACKAGES = ['numpy', 'pandas']


def append_blend(blend_path, section, name):
    if bpy.data.objects.get(name) is not None:
        blend = bpy.data.objects[name]
    else:
        bpy.ops.wm.append(filepath=f"{blend_path}/{section}/{name}", directory=f"{blend_path}/{section}", filename=name)
        blend = bpy.context.scene.objects[-1]
    return blend


# def install_packages():
#     try:
#         ensurepip.bootstrap()
#         for package in REQUIRED_PACKAGES:
#             try:
#                 __import__(package)
#             except ImportError:
#                 logger.info(f"{package} not found, installing...")
#                 subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
#     except Exception as e:
#         logger.exception(f"Error installing packages: {str(e)}")


def select_only(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def reset_parent_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')


def apply_transform(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True, isolate_users=True)
    bpy.ops.object.select_all(action='DESELECT')


def delete_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    return 0


def delete_object(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.delete()


def delete_unmesh():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            obj.select_set(True)
        if ("sky" in obj.name.lower()) and ("sphere" in obj.name.lower()):
            obj.select_set(True)
    bpy.ops.object.delete()


def separate_by_material(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.separate(type='MATERIAL')
    bpy.ops.object.mode_set(mode='OBJECT')


def separate_by_loose(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles()
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    return bpy.context.selected_objects


def join_component(obj_component):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in obj_component:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = obj_component[0]
    bpy.ops.object.join()
