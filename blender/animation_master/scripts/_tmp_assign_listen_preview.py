import bpy
arm = bpy.data.objects['VAMP Laurina for G8 Female']
arm.animation_data_create()
arm.animation_data.action = bpy.data.actions['listen_base_v1']
for obj_name, action_name in [
    ('VAMP Laurina for G8 Female.Shape', 'listen_face_body_v1'),
    ('Genesis 8 Female Eyelashes.Shape', 'listen_face_lashes_v1'),
    ('VAMPLaurinaBrows.Shape', 'listen_face_brows_v1'),
]:
    obj = bpy.data.objects[obj_name]
    keys = obj.data.shape_keys
    keys.animation_data_create()
    keys.animation_data.action = bpy.data.actions[action_name]
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 88
bpy.ops.wm.save_mainfile()
print('ASSIGNED_LISTEN_PREVIEW')
