import bpy
arm=bpy.data.objects['VAMP Laurina for G8 Female']
action=bpy.data.actions.get('idle_base_v1')
if arm.animation_data is None:
    arm.animation_data_create()
arm.animation_data.action = action
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 96
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_mainfile()
print('RESTORED idle_base_v1 at frame 1')
