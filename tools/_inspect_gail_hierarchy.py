import bpy
names=['hip','pelvis','abdomenLower','abdomenUpper','chestLower','chestUpper','lCollar','lShldrBend','lForearmBend','lHand','lThighBend','lShin','rCollar','rShldrBend','rForearmBend','rHand','rThighBend','rShin']
arm=bpy.data.objects['VAMP Laurina for G8 Female']
for n in names:
    pb=arm.pose.bones.get(n)
    if pb:
        print(n,'parent=',pb.parent.name if pb.parent else None)
