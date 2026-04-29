extends SceneTree


func _init() -> void:
	for path in [
		"res://assets/gail/GAIL.glb",
		"res://assets/gail/hair/long_hair_grey.glb",
		"res://assets/gail/clothes/OVERALLS.glb"
	]:
		inspect_bounds(path)
	quit()


func inspect_bounds(path: String) -> void:
	print("--- Bounds: %s" % path)
	if not ResourceLoader.exists(path):
		print("missing")
		return
	var packed: PackedScene = load(path)
	if packed == null:
		print("failed_to_load")
		return
	var inst := packed.instantiate()
	if not (inst is Node3D):
		print("not_node3d")
		return
	var root := inst as Node3D
	var aabb := _compute_aabb(root)
	print("aabb_pos=%s aabb_size=%s height=%.4f" % [aabb.position, aabb.size, aabb.size.y])


func _compute_aabb(root: Node3D) -> AABB:
	var combined := AABB()
	var has_any := false
	for node in root.find_children("*", "VisualInstance3D", true, false):
		if node is MeshInstance3D:
			var mi := node as MeshInstance3D
			if mi.mesh == null:
				continue
			var local_aabb := mi.get_aabb()
			var global_aabb := _transform_aabb(local_aabb, mi.global_transform)
			if has_any:
				combined = combined.merge(global_aabb)
			else:
				combined = global_aabb
				has_any = true
	if not has_any:
		return AABB(Vector3.ZERO, Vector3.ONE)
	return combined


func _transform_aabb(box: AABB, xf: Transform3D) -> AABB:
	var corners: Array[Vector3] = [
		Vector3(box.position.x, box.position.y, box.position.z),
		Vector3(box.end.x, box.position.y, box.position.z),
		Vector3(box.position.x, box.end.y, box.position.z),
		Vector3(box.position.x, box.position.y, box.end.z),
		Vector3(box.end.x, box.end.y, box.position.z),
		Vector3(box.end.x, box.position.y, box.end.z),
		Vector3(box.position.x, box.end.y, box.end.z),
		Vector3(box.end.x, box.end.y, box.end.z)
	]
	var min_v: Vector3 = xf * corners[0]
	var max_v: Vector3 = min_v
	for i in range(1, corners.size()):
		var p: Vector3 = xf * corners[i]
		min_v = min_v.min(p)
		max_v = max_v.max(p)
	return AABB(min_v, max_v - min_v)
