bl_info = {
    'name': 'AnimoXtend',
    'description': 'Integrates with Animo, empowers your animation creativity',
    'author': 'edwardyzt@gmail.com',
    'version': (1, 2, 2),
    'blender': (3, 6, 0),
    'location': 'View3D > Sidebar > AnimoXtend',
    'warning': '',
    'doc_url': 'https://blendermarket.com/creator/products/animoxtend-ai-animotion-generation-toolbox/',
    'tracker_url': '',
    'support': 'COMMUNITY',
    'category': 'Animation',
}  # Generated with `cli/bl_info.py`. # type: ignore

# import sys
# from pathlib import Path

# PACKAGES_FOLDER = Path(__file__).absolute().parents[1]  # Root directory
# if PACKAGES_FOLDER.as_posix() not in sys.path:
#     sys.path.insert(0, PACKAGES_FOLDER.as_posix())  # Add to path for imports
from . import auto_load

auto_load.init()


def register():
    """Register addon. Called when the addon is enabled."""
    auto_load.register()


def unregister():
    """Free resources before unregistering the addon.

    Blender(>2.91) calls unregister on exit in by `WM_exit_ex`
    at `source/blender/windowmanager/intern/wm_init_exit.cc` through `bpy.utils._on_exit()`.
    (<https://projects.blender.org/blender/blender/src/commit/0b0fddb614cb49932c7c5d775a978ad963a62e79/source/blender/windowmanager/intern/wm_init_exit.cc#L510>)

    This only calls unregister for the installed and enabled add-ons though, not for scripts run from the text editor.
    """
    auto_load.unregister()
