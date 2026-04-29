import bpy, json, sys

report = {"armatures": [], "meshes": [], "collections": []}

for obj in bpy.data.objects:
    if obj.type == "ARMATURE":
        bones = [b.name for b in obj.data.bones]
        report["armatures"].append({
            "name": obj.name,
            "bone_count": len(bones),
            "root_bones": [b.name for b in obj.data.bones if b.parent is None],
            "sample_bones": bones[:30],
            "action_count": len(bpy.data.actions),
            "action_names": [a.name for a in bpy.data.actions][:20]
        })
    elif obj.type == "MESH":
        sk = obj.data.shape_keys
        report["meshes"].append({
            "name": obj.name,
            "vertex_count": len(obj.data.vertices),
            "armature_modifier": next((m.object.name for m in obj.modifiers if m.type == "ARMATURE" and m.object), None),
            "shape_key_count": len(sk.key_blocks) if sk else 0
        })

for c in bpy.data.collections:
    report["collections"].append(c.name)

print("CHERRY_REPORT:" + json.dumps(report))
