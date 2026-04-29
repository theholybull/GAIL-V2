import bpy
print('FILE', bpy.data.filepath)
print('ARMATURES', [o.name for o in bpy.data.objects if o.type=='ARMATURE'])
print('MESH_COUNT', len([o for o in bpy.data.objects if o.type=='MESH']))
print('COLLECTIONS', [c.name for c in bpy.data.collections])
print('ACTIONS', len(bpy.data.actions))
for name in [o.name for o in bpy.data.objects if o.type=='ARMATURE']:
    arm = bpy.data.objects.get(name)
    print('ARM', name, 'BONES', len(arm.data.bones))
    sample = [b.name for b in arm.data.bones[:15]]
    print('BONE_SAMPLE', sample)
