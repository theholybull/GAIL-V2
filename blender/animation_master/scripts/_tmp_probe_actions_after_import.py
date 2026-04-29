import bpy
print('ACTIONS',[(a.name,int(a.frame_range[0]),int(a.frame_range[1]),a.use_fake_user) for a in bpy.data.actions])
print('COLL_MISSING',[name for name in ['00_REFERENCE','01_RIG','02_BODY','03_HAIR','04_CLOTHES','05_ACCESSORIES','06_FACE_TEST','07_ANIM_LIBRARY','08_IMPORT_SOURCES','09_EXPORT_STAGING','10_QA','90_ARCHIVE','99_DEPRECATED'] if bpy.data.collections.get(name) is None])
arm=bpy.data.objects.get('Victoria 8')
print('ARM',bool(arm), arm.data.name if arm else None, arm.animation_data.action.name if arm and arm.animation_data and arm.animation_data.action else None)
