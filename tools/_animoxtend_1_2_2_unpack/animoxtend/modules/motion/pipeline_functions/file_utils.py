import json
import logging
import os
from pathlib import Path

import bpy

VERSION = bpy.app.version[0]  # version of blender

logger = logging.getLogger("animoxtend")


def enable_gpu(device_type: str = 'CUDA'):
    """Enable GPU devices for rendering"""
    preferences = bpy.context.preferences
    bpy.context.scene.render.engine = 'CYCLES'
    cycles_preferences = preferences.addons['cycles'].preferences
    # newer than 3.0
    if VERSION >= 3:
        cycles_preferences.refresh_devices()
        devices = cycles_preferences.get_devices_for_type(compute_device_type=device_type)
    # for version 2.X
    else:
        cycles_preferences = preferences.addons['cycles'].preferences
        cuda_devices, opencl_devices = cycles_preferences.get_devices()
        if device_type == 'CUDA':
            devices = cuda_devices
        elif device_type == 'OPENCL':
            devices = opencl_devices
        else:
            raise RuntimeError('Unsupported device type')
    activated_gpus = []

    cpu_devices = [device for device in devices if device.type == 'CPU']
    gpu_devices = [device for device in devices if device.type == device_type]

    for device in cpu_devices:
        logger.debug(f'Device enabled: {device.name}.')
        device.use = True

    for _idx, device in enumerate(gpu_devices):
        logger.debug(f'Device enabled: {device.name}.')
        device.use = True
        activated_gpus.append(device.name)

    if len(activated_gpus) <= 0:
        logger.warning('[!] Failed to enable GPU. Going to use CPU only.')
    else:
        logger.info(f'[+] GPU enabled: {activated_gpus}.')
        cycles_preferences.compute_device_type = device_type
        bpy.context.scene.cycles.device = 'GPU'


def save_blend(blend_path: Path):
    try:
        bpy.ops.wm.save_mainfile(filepath=str(blend_path))
        logger.info(f"save blend: {blend_path}")
    except Exception as e:
        logger.exception(e)


def load_json(file_path: str | Path):
    if os.path.exists(file_path):
        with open(file_path) as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    else:
        data = {}
    return data


def save_data_to_json(file_path: str | Path, data):
    directory = os.path.dirname(file_path)

    if not os.path.exists(directory):
        os.makedirs(directory)

    with open(file_path, 'w') as f:
        json.dump(data, f)


# def append_blend(blend_path, section, name):
#     bpy.ops.wm.append(
#         filepath=str(blend_path / section / name),
#         directory=str(blend_path / section),
#         filename=name
#     )

#     # 获取最近导入的对象（应该是armature）
#     blend_armature = bpy.context.scene.objects[-1]
#     return blend_armature
