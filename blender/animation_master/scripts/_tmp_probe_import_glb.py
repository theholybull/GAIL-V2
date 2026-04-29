import bpy
from pathlib import Path
source = Path(r"C:/Users/bate_/OneDrive/Desktop/Gail 2.1/converted_animations_20260401/idle/27775_stand_still.glb")
print('SOURCE', source)
before_actions=set(a.name for a in bpy.data.actions)
before_objects=set(o.name for o in bpy.data.objects)
res=bpy.ops.import_scene.gltf(filepath=str(source))
print('IMPORT_RES',res)
after_actions=[a for a in bpy.data.actions if a.name not in before_actions]
print('NEW_ACTIONS',[a.name for a in after_actions])
new_objects=[o for o in bpy.data.objects if o.name not in before_objects]
print('NEW_OBJECTS',[(o.name,o.type) for o in new_objects])
for o in new_objects:
    if o.type=='ARMATURE':
        print('ARM',o.name,'BONES',len(o.data.bones))
        print('BONE_SAMPLE',[b.name for b in o.data.bones[:20]])
print('TOTAL_ACTIONS',len(bpy.data.actions))
