import bpy
arm = bpy.data.objects.get('VAMP Laurina for G8 Female')
action = bpy.data.actions.get('idle_mixamo_test_v5')
if action is None:
    print('ACTION missing: idle_mixamo_test_v5')
else:
    if arm and arm.animation_data and arm.animation_data.action == action:
        fallback = bpy.data.actions.get('idle_base_v1')
        arm.animation_data.action = fallback
    action.use_fake_user = False
    bpy.data.actions.remove(action)
    print('REMOVED idle_mixamo_test_v5')
bpy.ops.wm.save_mainfile()
print('SAVED', bpy.data.filepath)
