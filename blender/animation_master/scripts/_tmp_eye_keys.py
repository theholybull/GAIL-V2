import bpy
for obj_name in ['VAMP Laurina for G8 Female.Shape']:
    keys = bpy.data.objects[obj_name].data.shape_keys.key_blocks.keys()
    matches = [k for k in keys if 'eye' in k.lower() or 'look' in k.lower()]
    print(matches[:120])
