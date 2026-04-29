import argparse
import json
import shutil
import sys
from pathlib import Path

import bpy

SKIN_KEYWORDS = [
    'skin', 'torso', 'face', 'ear', 'leg', 'arm', 'lip', 'mouth', 'eyesocket',
    'genital', 'nail', 'pupil', 'iris', 'sclera', 'cornea', 'eyemoisture', 'teeth',
]
CLOTHING_KEYWORDS = [
    'cloth', 'clothing', 'boot', 'pant', 'vest', 'shirt', 'belt', 'bracelet', 'shoe',
    'jacket', 'dress', 'hat', 'coat', 'glove', 'accessor',
]


def parse_args():
    argv = sys.argv
    if '--' in argv:
        argv = argv[argv.index('--') + 1:]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument('--blend', required=True)
    parser.add_argument('--output-root', required=True)
    parser.add_argument('--report', required=True)
    parser.add_argument('--addon-dir', required=True)
    parser.add_argument('--package-name', default='Gail Final 20260406')
    parser.add_argument('--target-height-m', type=float, default=1.72)
    parser.add_argument('--skin-ior', type=float, default=1.1)
    parser.add_argument('--clothing-ior', type=float, default=1.0)
    parser.add_argument('--low-size', type=int, default=512)
    parser.add_argument('--medium-size', type=int, default=2048)
    parser.add_argument('--high-size', type=int, default=4096)
    return parser.parse_args(argv)


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')


def enable_local_addon(addon_dir: Path):
    scripts_root = Path(bpy.utils.user_resource('SCRIPTS'))
    addons_root = scripts_root / 'addons'
    addons_root.mkdir(parents=True, exist_ok=True)
    target = addons_root / 'gail_production_workbench'
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(addon_dir, target)
    bpy.ops.preferences.addon_enable(module='gail_production_workbench')


def classify_material(name: str):
    lowered = name.lower()
    if any(token in lowered for token in SKIN_KEYWORDS):
        return 'skin'
    if any(token in lowered for token in CLOTHING_KEYWORDS):
        return 'clothing'
    return None


def apply_ior_rules(skin_ior: float, clothing_ior: float):
    changed = {'skin': 0, 'clothing': 0}
    for mat in bpy.data.materials:
        if not mat or not mat.use_nodes or not mat.node_tree:
            continue
        bucket = classify_material(mat.name)
        if bucket is None:
            continue
        target_ior = skin_ior if bucket == 'skin' else clothing_ior
        for node in mat.node_tree.nodes:
            if node.type != 'BSDF_PRINCIPLED':
                continue
            ior_input = node.inputs.get('IOR')
            if ior_input is None:
                continue
            ior_input.default_value = target_ior
            changed[bucket] += 1
    return changed


def detect_armature_name():
    armatures = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']
    if not armatures:
        raise RuntimeError('No armature found in blend.')
    scored = []
    for arm in armatures:
        skinned = 0
        for obj in bpy.data.objects:
            if obj.type != 'MESH':
                continue
            for mod in obj.modifiers:
                if mod.type == 'ARMATURE' and mod.object == arm:
                    skinned += 1
                    break
        scored.append((skinned, arm.name))
    scored.sort(reverse=True)
    return scored[0][1]


def force_armature_rest_pose(armature_obj):
    # Ensure exports use rig rest-pose orientation instead of any staged/animated pose.
    bpy.ops.object.mode_set(mode='OBJECT')
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    if armature_obj.data and hasattr(armature_obj.data, 'pose_position'):
        armature_obj.data.pose_position = 'REST'
    if armature_obj.animation_data and armature_obj.animation_data.action:
        armature_obj.animation_data.action = None
    try:
        bpy.ops.object.mode_set(mode='POSE')
        for bone in armature_obj.pose.bones:
            bone.location = (0.0, 0.0, 0.0)
            bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
            bone.rotation_euler = (0.0, 0.0, 0.0)
            bone.scale = (1.0, 1.0, 1.0)
        bpy.ops.object.mode_set(mode='OBJECT')
    except Exception:
        bpy.ops.object.mode_set(mode='OBJECT')


def main():
    args = parse_args()
    blend_path = Path(args.blend)
    output_root = Path(args.output_root)
    report_path = Path(args.report)
    addon_dir = Path(args.addon_dir)

    report = {
        'blend': str(blend_path),
        'output_root': str(output_root),
        'addon_dir': str(addon_dir),
        'package_name': args.package_name,
        'steps': {},
        'errors': [],
    }

    try:
        output_root.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.open_mainfile(filepath=str(blend_path))
        enable_local_addon(addon_dir)
        import gail_production_workbench as gpw

        armature_name = detect_armature_name()
        arm = bpy.data.objects.get(armature_name)
        if arm is None:
            raise RuntimeError(f'Missing armature after detection: {armature_name}')
        if arm.animation_data is None:
            arm.animation_data_create()
        force_armature_rest_pose(arm)

        scene = bpy.context.scene
        scene.gail_prod.armature = arm
        scene.gail_prod.output_root = str(output_root)
        scene.gail_prod.package_name = args.package_name
        scene.gail_prod.lock_export_scale = True
        scene.gail_prod.export_target_height_m = float(args.target_height_m)
        scene.gail_prod.low_texture_size = int(args.low_size)
        scene.gail_prod.medium_texture_size = int(args.medium_size)
        scene.gail_prod.high_texture_size = int(args.high_size)

        report['detected_armature'] = armature_name

        report['steps']['scan_scene'] = list(bpy.ops.gail_prod.scan_scene())
        ior_result = apply_ior_rules(args.skin_ior, args.clothing_ior)
        report['steps']['apply_ior_rules'] = ior_result
        report['steps']['partition_avatar'] = list(bpy.ops.gail_prod.partition_avatar())
        report['steps']['export_avatar_parts'] = list(bpy.ops.gail_prod.export_avatar_parts())
        report['steps']['tune_skin_materials'] = list(bpy.ops.gail_prod.tune_skin_materials())
        try:
            report['steps']['export_texture_tiers'] = list(bpy.ops.gail_prod.export_texture_tiers())
        except Exception as exc:
            report['steps']['export_texture_tiers'] = ['FAILED_CONTINUED']
            report.setdefault('warnings', []).append(str(exc))

        gpw.write_package_manifest(scene.gail_prod, arm, '')
        report['steps']['write_package_manifest'] = ['FINISHED']

        report['avatar_package'] = str(output_root / 'avatar_package')
    except Exception as exc:
        report['errors'].append(str(exc))
    finally:
        write_json(report_path, report)

    if report['errors']:
        raise RuntimeError('; '.join(report['errors']))


if __name__ == '__main__':
    main()
