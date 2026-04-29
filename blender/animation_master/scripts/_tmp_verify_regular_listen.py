import bpy
arm = bpy.data.objects['VAMP Laurina for G8 Female']
print('ARM_ACTION', arm.animation_data.action.name if arm.animation_data and arm.animation_data.action else None)
for obj_name in ['VAMP Laurina for G8 Female.Shape', 'Genesis 8 Female Eyelashes.Shape', 'VAMPLaurinaBrows.Shape']:
    keys = bpy.data.objects[obj_name].data.shape_keys
    print(obj_name, keys.animation_data.action.name if keys.animation_data and keys.animation_data.action else None)
print('RANGE', bpy.context.scene.frame_start, bpy.context.scene.frame_end)
