import bpy
arm = bpy.data.objects['VAMP Laurina for G8 Female']
print([b.name for b in arm.pose.bones if 'eye' in b.name.lower() or 'look' in b.name.lower()])
