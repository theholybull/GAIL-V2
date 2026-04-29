import bpy
arm=bpy.data.objects.get('VAMP Laurina for G8 Female')
print('ARMATURE', arm is not None)
if arm:
    ad = arm.animation_data
    print('CURRENT_ACTION', ad.action.name if ad and ad.action else None)
    print('FRAME', bpy.context.scene.frame_current)
for name in ['idle_base_v1','listen_base_v1','talk_base_v1','idle_mixamo_test_v5','idle_mixamo_test_v4','idle_mixamo_test_v3','idle_mixamo_test_v2','idle_mixamo_test_v1']:
    action=bpy.data.actions.get(name)
    print('ACTION', name, 'exists=', action is not None, 'range=', tuple(int(v) for v in action.frame_range) if action else None, 'fake=', bool(action.use_fake_user) if action else None)
