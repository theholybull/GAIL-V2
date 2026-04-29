import bpy
print('FILE', bpy.data.filepath)
arm = bpy.data.objects.get('VAMP Laurina for G8 Female')
print('HAS_ARM', bool(arm))
if arm:
    print('OBJ_LOC', tuple(round(v,6) for v in arm.location))
    print('OBJ_ROT', tuple(round(v,6) for v in arm.rotation_euler))
    print('OBJ_SCALE', tuple(round(v,6) for v in arm.scale))
    print('FRAME', bpy.context.scene.frame_current, bpy.context.scene.frame_start, bpy.context.scene.frame_end)
    ad = arm.animation_data
    print('ARM_ACTION', ad.action.name if ad and ad.action else None)
    for name in ['chestUpper','neckUpper','head','lCollar','lShldrBend','lForearmBend','lHand','rCollar','rShldrBend','rForearmBend','rHand','lThighBend','lShin','rThighBend','rShin']:
        pb = arm.pose.bones.get(name)
        if pb:
            vals = tuple(round(v,6) for v in getattr(pb,'rotation_euler',(0,0,0)))
            print('BONE', name, pb.rotation_mode, vals)
print('ACTIONS', [a.name for a in bpy.data.actions[:20]])
