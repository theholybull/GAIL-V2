import bpy, json, sys

bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[-1])

report = {"armatures": [], "meshes": []}
for obj in bpy.data.objects:
    if obj.type == "ARMATURE":
        bones = [b.name for b in obj.data.bones]
        report["armatures"].append({
            "name": obj.name,
            "bone_count": len(bones),
            "root_bones": [b.name for b in obj.data.bones if b.parent is None],
            "sample_bones": bones[:20],
            "action_count": len(bpy.data.actions),
            "action_names": [a.name for a in bpy.data.actions][:5]
        })
    elif obj.type == "MESH":
        report["meshes"].append({"name": obj.name, "vertex_count": len(obj.data.vertices)})

print("ANIM_REPORT:" + json.dumps(report))
