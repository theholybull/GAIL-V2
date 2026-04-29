import bpy
print('FILE', bpy.data.filepath)
for obj in bpy.data.objects:
    if obj.type=='MESH':
        sk = getattr(obj.data,'shape_keys',None)
        count = len(sk.key_blocks) if sk else 0
        print(f"MESH|{obj.name}|SHAPE_KEYS|{count}")
