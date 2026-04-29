import bpy
for obj_name in ['Victoria 8.Shape','Genesis 8 Female Eyelashes.Shape','Boho Tank.Shape','Savanna Hair.Shape']:
    obj=bpy.data.objects.get(obj_name)
    if not obj:
        print('MISS',obj_name)
        continue
    keys=obj.data.shape_keys
    if not keys:
        print('NO_KEYS',obj_name)
        continue
    names=[k.name for k in keys.key_blocks]
    print('KEYS',obj_name,len(names))
    print('SAMPLE',names[:25])
