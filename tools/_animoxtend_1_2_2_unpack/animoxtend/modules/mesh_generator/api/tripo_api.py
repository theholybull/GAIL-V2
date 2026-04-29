import logging
import mimetypes

from ....utils.http import RequestException, XClient

logger = logging.getLogger("animoxtend")

generate_style_list = [
    "original",
    "person:person2cartoon",
    "animal:venom",
    "object:clay",
    "object:steampunk",
    "object:christmas",
    "object:barbie",
]

pp_style_list = ["original", "lego", "voxel", "voronoi", "minecraft"]

convert_list = ["GLTF", "USDZ", "FBX", "OBJ", "STL", "3MF"]

texture_alignment_list = ["original_image", "geometry"]

texture_quality_list = ["detailed", "standard"]


def _get_client(api_key):
    base_url = "https://api.tripo3d.ai/v2/openapi"
    return XClient(base_url=base_url, api_key=api_key)


def upload_image(api_key, file_path):
    endpoint = "/upload"

    mime_type = mimetypes.guess_type(file_path)[0]
    if mime_type is None:
        msg = f"upload_image: unknown file mime_type of {file_path}!"
        logger.error(msg)
        return None, msg

    client = _get_client(api_key)
    try:
        with open(file_path, "rb") as f:
            files = {"file": (file_path, f, mime_type)}
            response = client.post(
                endpoint,
                files=files,
            )
            response.raise_for_status()
    except RequestException as e:
        logger.exception(f"upload_image request error: {str(e)}")
        return None, str(e)
    try:
        logger.info(f"upload_image: {response.json()} success!")
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse upload_image response: {str(e)}")
        return None, str(e)


def image_to_model(api_key, image_token, style):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "image_to_model",
        "file": {"type": "jpg", "file_token": image_token},
        "model_version": "v2.5-20250123",
    }
    if style != "original":
        data["style"] = style
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"image_to_model request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse image_to_model response: {str(e)}")
        return None, str(e)


def text_to_model(api_key, text, style):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "text_to_model",
        "prompt": text,
        "model_version": "v2.5-20250123",
    }
    if style != "original":
        data["style"] = style
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse text_to_model response: {str(e)}")
        return None, str(e)


def multiview_to_model(api_key, image_token_list):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "multiview_to_model",
        "files": image_token_list,
        "model_version": "v2.5-20250123",
    }

    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"multiview_to_model request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse multiview_to_model response: {str(e)}")
        return None, str(e)


def texture_generate(api_key, task_id, texture_alignment, texture_quality):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "texture_model",
        "original_model_task_id": task_id,
        "texture_alignment": texture_alignment,
        "texture_quality": texture_quality,
    }
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
        return response.json(), None
    except RequestException as e:
        logger.exception(f"texture_generate request error: {str(e)}")
        return None, str(e)
    except Exception as e:
        logger.exception(f"Failed to parse texture_generate response: {str(e)}")
        return None, str(e)


def refine_model(api_key, task_id):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {"type": "refine_model", "draft_model_task_id": task_id}
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
        return response.json(), None
    except RequestException as e:
        logger.exception(f"refine_model request error: {str(e)}")
        return None, str(e)
    except Exception as e:
        logger.exception(f"Failed to parse refine_model response: {str(e)}")
        return None, str(e)


def stylize_model(api_key, task_id, style_name):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "stylize_model",
        "style": style_name,
        "original_model_task_id": task_id,
    }
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
        return response.json(), None
    except RequestException as e:
        logger.exception(f"stylize_model request error: {str(e)}")
        return None, str(e)
    except Exception as e:
        logger.exception(f"Failed to parse stylize_model response: {str(e)}")
        return None, str(e)


def convert_model(api_key, task_id, quad, symmetry, face_limit):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "convert_model",
        "format": "GLTF",
        "original_model_task_id": task_id,
        "quad": quad,
        "symmetry": symmetry,
        "face_limit": face_limit,
    }
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"convert_model request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse convert_model response: {str(e)}")
        return None, str(e)


def rig_check(api_key, task_id):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {"type": "animate_prerigcheck", "original_model_task_id": task_id}
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"rig_check request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse rig_check response: {str(e)}")
        return None, str(e)


def rig_model(api_key, task_id):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "animate_rig",
        "original_model_task_id": task_id,
        "out_format": "glb",
    }
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"rig_model request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse rig_model response: {str(e)}")
        return None, str(e)


def retarget(api_key, task_id):
    endpoint = "/task"
    headers = {"Content-Type": "application/json"}
    data = {
        "type": "animate_retarget",
        "original_model_task_id": task_id,
        "out_format": "glb",
        "animation": "preset:run",
    }
    client = _get_client(api_key)
    try:
        response = client.post(endpoint, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"retarget request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse retarget response: {str(e)}")
        return None, str(e)


def check_wallet(api_key):
    endpoint = "/user/balance"
    headers = {"Content-Type": "application/json"}
    client = _get_client(api_key)
    try:
        response = client.get(endpoint, headers=headers)
        response.raise_for_status()
    except RequestException as e:
        logger.exception(f"check_wallet request error: {str(e)}")
        return None, str(e)
    try:
        return response.json(), None
    except Exception as e:
        logger.exception(f"Failed to parse check_wallet response: {str(e)}")
        return None, str(e)
