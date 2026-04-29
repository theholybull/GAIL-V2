import logging
from pathlib import Path
from typing import Dict, Optional, Tuple, Union
from urllib.parse import urlparse

# from ....assets.resource_manager import Config
from ....utils.http import RequestException, XClient

# from ..pipeline_functions.file_utils import load_json

logger = logging.getLogger("animoxtend")


def get_server_info() -> str:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    # base_url = animo_config["sperson_retrieval"]
    # base_url = get_preferences().server_host + "/api/motion/motion-sperson-retrieval-api"
    base_url = "/api/motion/motion-sperson-retrieval-api"
    return base_url


def get_retarget_info() -> str:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    # base_url = animo_config["retarget"]
    # base_url = get_preferences().server_host + "/api/motion/motion-retarget-api"
    base_url = "/api/motion/motion-retarget-api"
    return base_url


def get_motionfbx_info() -> str:
    # json_path = Config().load_animo_config()
    # animo_config = load_json(json_path)
    # base_url = animo_config["export"]
    # base_url = get_preferences().server_host + "/api/motion/motion-export-api"
    base_url = "/api/motion/motion-export-api"
    return base_url


def retrieve_motion_by_text(
    keyword: str, topk: int, language: str
) -> tuple[Optional[list[str]], Optional[list[str]], Optional[Exception]]:
    """Retrieve motions by keyword

    Args:
        keyword (str): keyword of motions
        topk (int): top-k
        language (str): language of keyword

    Returns:
        tuple[Optional[list[str]], Optional[list[str]], Optional[Exception]]:
            list of motion ids, list of motion names, exception
    """
    internal_api = get_server_info()
    external_api = get_server_info()
    avatar = "CC-neutral"
    match_threshold = None

    json_dict = dict(keyword=keyword, topk=topk, avatar=avatar, match_threshold=match_threshold)
    route = f"/retrieve_motion_by_keyword_{language}/"
    client = XClient(internal_api)

    resp = None
    try:
        resp = client.post(
            route,
            json=json_dict,
            verify=False,
        )
        resp.raise_for_status()
    except RequestException as http_err:
        msg = f"HTTP error occurred: {http_err}"
        if resp and resp.text:
            msg += f" - Response: {resp.text}"
        logger.exception(msg)
        return None, None, http_err
    try:
        # ret_list = list()
        annotation_list = list()
        motion_url_list = list()
        for motion in resp.json():
            # ret_list.append(
            #     dict(
            #         motion_record_id = str(motion["motion_record_id"]),
            #         annotation = motion["annotation"],
            #         score = motion["score"],
            #         internal_motion_url = f'{internal_api}{motion["motion_url"]}',
            #         external_motion_url = f'{external_api}{motion["motion_url"]}',
            #     )
            # )
            # if len(ret_list) >=topk:
            #     break
            annotation_list.append(str(motion["motion_record_id"]) + "_" + motion["annotation"])
            motion_url_list.append(
                f'{external_api}{motion["motion_url"]}',
            )
            if len(annotation_list) >= topk:
                break
        # logger.debug(f"t2m list: {ret_list}")
        return annotation_list, motion_url_list, None
    except Exception as err:
        logger.exception(f"Error parsing response: {str(err)}")
        return None, None, err


def request_retarget(motion_url: str) -> tuple[dict[str, str], Optional[str]]:
    logger.debug(f"motion_url: {motion_url}")
    retarget_url = get_retarget_info()
    req_dict = {
        "src_actor": "CC-Neutral",
        "dst_actor": "CC-Neutral",
        "input_npz_type": "retrieval",
        "npz_url": motion_url,
    }
    client = XClient(retarget_url)
    try:
        response = client.post("/retarget_npz_file_url/", json=req_dict, timeout=1000)
        response.raise_for_status()
    except RequestException as err:
        logger.exception(f"Error requesting retargeting: {str(err)}")
        return {}, str(err)
    try:
        resp_dict = response.json()
        remotion_url = resp_dict["ret_url"]
        return {
            "retarget_motion_url": f"{retarget_url}{remotion_url}",
        }, None
    except Exception as err:
        logger.exception(f"Error parsing response: {str(err)}")
        return {}, str(err)


def export(dst_actor, motion_url) -> Tuple[Dict[str, str], Union[str, None]]:
    motion_export_url = get_motionfbx_info()
    req_dict = {
        "input_npz_type": "retrieval",
        "npz_urls": [motion_url],
        "restpose_names": [dst_actor],
        "export_glb": 0,
        "export_fbx": 1,
    }

    client = XClient(motion_export_url)
    try:
        response = client.post("/export_url/", json=req_dict)
        response.raise_for_status()
    except RequestException as http_err:
        logger.exception(f"Error requesting FBX motion: {str(http_err)}")
        return {}, str(http_err)
    try:
        resp_dict = response.json()
        fbx_url = resp_dict["fbx_url"]
        return {"fbx_url": f"{motion_export_url}{fbx_url}"}, None
    except Exception as err:
        logger.exception(f"Error parsing response: {str(err)}")
        return {}, str(err)


def save_npz(url: str, save_folder: Path, filename: str | None = None) -> Path:
    """Save npz file from url to local.

    Args:
        url (str): url of npz file
        save_folder (Path): folder to save npz file
        filename (str, optional): filename of npz file. Defaults to None.

    Raises:
        RuntimeError: If an error occurs while saving the npz file.
    """
    try:
        url = urlparse(url).geturl()
    except Exception as e:
        msg = f"Error parsing url: {e!s} {url=}"
        logger.exception(msg)
        raise RuntimeError(msg) from e

    if filename is None:
        filename: str = url.rpartition("/")[-1]
        assert filename, f"Unable to extract filename from <{url=}>"

    file_path = save_folder / filename
    save_folder.mkdir(parents=True, exist_ok=True)

    client = XClient("")
    response = client.get(url, stream=True)

    if response.status_code == 200:
        with file_path.open("wb") as file:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    file.write(chunk)
        # file_path.write_bytes(response.content)
        logger.info(f"文件已下载并保存到: {file_path}")
        return file_path
    else:
        logger.error(f"下载失败，状态码: {response.status_code}")
        raise RuntimeError(f"下载失败，状态码: {response.status_code}")
