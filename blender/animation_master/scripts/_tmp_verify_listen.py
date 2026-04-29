import bpy
print('ACTIONS', [a.name for a in bpy.data.actions if a.name.startswith('listen')])
