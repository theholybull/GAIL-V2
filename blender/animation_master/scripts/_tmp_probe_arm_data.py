import bpy
arm=bpy.data.objects.get('Victoria 8')
print('ARM', bool(arm), 'DATA', arm.data.name if arm else None)
