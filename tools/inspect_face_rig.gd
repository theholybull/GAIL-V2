extends SceneTree


func _init() -> void:
	inspect_avatar("res://assets/gail/GAIL.glb")
	quit()


func inspect_avatar(path: String) -> void:
	print("--- Face Inspect: %s" % path)
	if not ResourceLoader.exists(path):
		print("missing")
		return
	var packed: PackedScene = load(path)
	if packed == null:
		print("failed_to_load")
		return
	var inst := packed.instantiate()
	if inst == null:
		print("failed_to_instantiate")
		return

	var skeletons := inst.find_children("*", "Skeleton3D", true, false)
	for s in skeletons:
		var sk := s as Skeleton3D
		if sk == null:
			continue
		print("skeleton=%s bones=%d" % [sk.name, sk.get_bone_count()])
		for i in range(sk.get_bone_count()):
			var bone_name := String(sk.get_bone_name(i)).to_lower()
			if bone_name.contains("eye") or bone_name.contains("jaw") or bone_name.contains("head") or bone_name.contains("neck"):
				print("  face_bone[%d]=%s" % [i, sk.get_bone_name(i)])

	var meshes := inst.find_children("*", "MeshInstance3D", true, false)
	for node in meshes:
		var mi := node as MeshInstance3D
		if mi == null or mi.mesh == null:
			continue
		var mesh: Mesh = mi.mesh
		var blend_count: int = mesh.get_blend_shape_count()
		print("mesh=%s blend_shapes=%d" % [mi.name, blend_count])
		for i in range(min(blend_count, 40)):
			print("  blend[%d]=%s" % [i, mesh.get_blend_shape_name(i)])
