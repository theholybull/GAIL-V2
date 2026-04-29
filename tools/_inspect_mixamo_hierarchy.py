import bpy
before=set(bpy.data.objects.keys())
bpy.ops.import_scene.fbx(filepath=r'F:\Gail\blender\animation_master\source\imports\raw\Idle.fbx')
arm=[o for o in bpy.data.objects if o.name not in before and o.type=='ARMATURE'][0]
for n in ['mixamorig:Hips','mixamorig:Spine','mixamorig:Spine1','mixamorig:Spine2','mixamorig:LeftShoulder','mixamorig:LeftArm','mixamorig:LeftForeArm','mixamorig:LeftHand','mixamorig:LeftUpLeg','mixamorig:LeftLeg']:
    pb=arm.pose.bones.get(n)
    if pb:
        print(n,'parent=',pb.parent.name if pb.parent else None)
