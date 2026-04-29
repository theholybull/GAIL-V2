import json
import os
from pathlib import Path

# from .....assets.resource_manager import Config


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


def get_blending_server_info() -> str:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    # base_url = animo_config["blending"]
    # base_url = get_preferences().server_host + "/api/blending/blending/"
    base_url = "/api/blending/blending/"
    return base_url


def get_inbetween_server_info() -> str:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    # base_url = animo_config["inbetween"]
    # base_url = get_preferences().server_host + "/api/blending/inbetween/"
    base_url = "/api/blending/inbetween/"
    return base_url
