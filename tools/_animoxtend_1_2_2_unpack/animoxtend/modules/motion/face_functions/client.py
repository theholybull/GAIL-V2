import logging
from pathlib import Path

# from ....assets.resource_manager import Config
from ....preferences import get_preferences
from ....utils.http import XClient

# from ..pipeline_functions.file_utils import load_json

logger = logging.getLogger("animoxtend")


def get_server_info() -> tuple:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    preferences = get_preferences()
    # base_url = animo_config["server_url"]
    # base_url = preferences.server_host + "/api/motion"
    base_url = "/api/motion"
    apikey = preferences.api_key
    return base_url, apikey


def generate(audio_path: Path, model_name=None, emo_id=0):
    base_url, apikey = get_server_info()
    client = XClient(base_url, apikey)
    try:
        with audio_path.open("rb") as f_wav:
            resp = client.post(
                "/audio2face_upload/",
                files={
                    "audio": (
                        audio_path.name,
                        f_wav,
                        "application/octet-stream",
                    )
                },
                data=dict(model_name=model_name, emo_id=emo_id),
                verify=False,
            )
            resp.raise_for_status()
            return resp.content, None
    except Exception as e:
        return None, str(e)


def get_support_model_list():
    base_url, apikey = get_server_info()
    client = XClient(base_url, apikey)
    try:
        resp = client.get("/model_names/", headers=dict(apikey=apikey))
        resp.raise_for_status()
        model_list = resp.json()["model_names"]
        logger.debug(model_list)
        return model_list, None
    except Exception as err:
        logger.exception(f"Cannot get the model list from server: {str(err)}")
        return None, str(err)
