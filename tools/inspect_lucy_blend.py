import bpy, json
from pathlib import Path

armatures=[]
for obj in bpy.data.objects:
    if obj.type=='ARMATURE':
        armatures.append({
            'name': obj.name,
            'bone_count': len(obj.data.bones),
            'has_animation_data': bool(obj.animation_data and obj.animation_data.action),
        })

meshes=[]
for obj in bpy.data.objects:
    if obj.type!='MESH':
        continue
    shapekeys=[]
    keys = obj.data.shape_keys
    if keys and keys.key_blocks:
        for kb in keys.key_blocks:
            shapekeys.append(kb.name)
    meshes.append({
        'name': obj.name,
        'vertex_count': len(obj.data.vertices),
        'shape_key_count': len(shapekeys),
        'shape_keys': shapekeys,
        'materials': [slot.material.name if slot.material else None for slot in obj.material_slots],
        'armature_parent': obj.parent.name if obj.parent and obj.parent.type=='ARMATURE' else None,
        'armature_modifiers': [m.object.name for m in obj.modifiers if m.type=='ARMATURE' and m.object],
    })

meshes_sorted=sorted(meshes, key=lambda x: x['vertex_count'], reverse=True)

report={
    'blend_file': bpy.data.filepath,
    'armatures': armatures,
    'top_meshes_by_vertices': meshes_sorted[:40],
    'mesh_with_most_shape_keys': sorted(meshes, key=lambda x: x['shape_key_count'], reverse=True)[:20],
}

out_path=Path(r"C:/Users/bate_/OneDrive/Desktop/Gail 2.1/working_copy/docs/reports/lucy_blend_inventory.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'out': str(out_path), 'armatures': len(armatures), 'meshes': len(meshes)}, indent=2))
