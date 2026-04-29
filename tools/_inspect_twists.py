import bpy
arm=bpy.data.objects['VAMP Laurina for G8 Female']
for n in ['lShldrTwist','rShldrTwist','lForearmTwist','rForearmTwist','lThighTwist','rThighTwist','pelvis','chestLower']:
    pb=arm.pose.bones.get(n)
    print(n, 'exists=', pb is not None, 'parent=', pb.parent.name if pb and pb.parent else None)
