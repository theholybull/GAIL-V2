import bpy
arm = bpy.data.objects['VAMP Laurina for G8 Female']
arm.animation_data_create()
arm.animation_data.action = bpy.data.actions['talk_base_v1']
for obj_name, action_name in [
    ('VAMP Laurina for G8 Female.Shape', 'talk_face_body_v1'),
    ('Genesis 8 Female Eyelashes.Shape', 'talk_face_lashes_v1'),
    ('VAMPLaurinaBrows.Shape', 'talk_face_brows_v1'),
]:
    obj = bpy.data.objects[obj_name]
    keys = obj.data.shape_keys
    keys.animation_data_create()
    keys.animation_data.action = bpy.data.actions[action_name]
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 72
bpy.ops.wm.save_mainfile()
print('ASSIGNED_TALK_PREVIEW')
