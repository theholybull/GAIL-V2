import bpy
print("LISTEN_ACTIONS", [a.name for a in bpy.data.actions if a.name.startswith("listen")])
