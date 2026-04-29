import logging
import sys
import typing
from dataclasses import dataclass
from pathlib import Path

import addon_utils

if typing.TYPE_CHECKING:
    from typing_extensions import LiteralString

if sys.version_info < (3, 9):
    raise RuntimeError("Python 3.9 or later is required to run this script.")
elif sys.version_info < (3, 11):
    import pip._vendor.tomli as tomllib
else:
    import tomllib


ROOT_DIR = Path(__file__).absolute().parents[1]
BLENDER_MANIFEST_FILE = ROOT_DIR / "animoxtend" / "blender_manifest.toml"


@dataclass(frozen=True)
class Config:
    name: 'LiteralString' = "AnimoXtend"
    lower_name: 'LiteralString' = 'animoxtend'
    upper_name: 'LiteralString' = 'ANIMOXTEND'
    addon_global_var_name: 'LiteralString' = "animoxtend"

    # prefix for ui classes' `bl_idname`. Not applicable for operators
    header_prefix: 'LiteralString' = "ANIMOXTEND_HT_"
    menu_prefix: 'LiteralString' = "ANIMOXTEND_MT_"
    panel_prefix: 'LiteralString' = "ANIMOXTEND_PT_"
    ui_list_prefix: 'LiteralString' = "ANIMOXTEND_UL_"

    logging_level: int = logging.DEBUG

    @classmethod
    def get_addon_path(cls) -> Path:
        return Path(__file__).absolute().parent

    @classmethod
    def get_assets_path(cls) -> Path:
        return Path(__file__).absolute().parent / "assets"

    @classmethod
    def get_addon_bl_name(cls) -> str:
        """Get the name of the addon.

        Raises:
            RuntimeError: Raised when the addon name cannot be resolved.

        Returns:
            str: this addon's name. The name has the following conventions:
                - installed as Add-on: `get_addon_path().name`.
                - installed as Extension, `bl_ext.<Repository>.<Name>`.
        """
        resolved_addon_path = cls.get_addon_path().resolve()
        # for name, mod in addon_utils.addons_fake_modules.items():  # type: ignore
        #     if Path(mod.__file__).resolve().parent == resolved_addon_path.resolve():
        #         return name
        for mod in addon_utils.modules():
            if Path(mod.__file__).resolve().parent == resolved_addon_path.resolve():
                return mod.__name__
        if resolved_addon_path.name == cls.lower_name:
            return cls.lower_name
        raise RuntimeError(f"Failed to resolve addon name for {resolved_addon_path}")

    @classmethod
    def get_addon_homepage(cls) -> str:
        try:
            with BLENDER_MANIFEST_FILE.open("rb") as f:
                blender_manifest = tomllib.load(f)

            homepage_url = blender_manifest["website"]
            return homepage_url
        except Exception as e:
            raise RuntimeError("Error loading blender_manifest.toml") from e
