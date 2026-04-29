import logging
from typing import List, Optional

from .....utils.http import RequestException, XClient
from ..utils.file_utils import base64_str_to_npz, npz_to_base64_str
from .client_utils import get_blending_server_info, get_inbetween_server_info

logger = logging.getLogger("animoxtend")


DEFAULT_BLENDING_SETTING = {
    'trans_len': 10,
    'pre_context_len': 8,
    'pre_mask_len': 0,
    'next_context_len': 8,
    'next_mask_len': 0,
}


def request_blending(
    task_id: str,
    npz_dict_list: list[dict],
    blend_setting: dict,
    key_words_list: List[Optional[str]],
    blend_mode: str,
    use_state_machine: bool = True,
):
    headers = {"Content-Type": "application/json"}
    blending_apply_url = get_blending_server_info()

    blending_setting_list = [
        DEFAULT_BLENDING_SETTING,
        blend_setting,
    ]

    assert len(npz_dict_list) == len(blending_setting_list), "len(npz_url_list) != len(blending_setting_list)"
    assert len(key_words_list) == len(blending_setting_list), "len(key_words_list) != len(blending_setting_list)"

    npz_str_list = [npz_to_base64_str(npz_dict) for npz_dict in npz_dict_list]

    data = {
        "task_id": task_id,
        "npz_str_list": npz_str_list,
        "blend_setting_list": blending_setting_list,
        "key_words_list": key_words_list,
        "blend_mode": blend_mode.lower(),
        "batch": use_state_machine,
    }

    logger.debug("Sending request to blending server... ")

    client = XClient('')
    try:
        response = client.post(blending_apply_url, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.error(f"request_blending error: {str(e)}")
        raise e
    try:
        ret_npz_str_list = response.json()
        ret_npz_dict_list = [base64_str_to_npz(motion_str) for motion_str in ret_npz_str_list]
    except Exception as e:
        logger.error(f"Failed to parse request_blending response: {str(e)}")
        raise e
    return ret_npz_dict_list


def request_inbetween(motion_dict: dict, cond_frames_idx: list, seq_slice: list):
    headers = {"Content-Type": "application/json"}
    inbetween_url = get_inbetween_server_info()

    npz_str = npz_to_base64_str(motion_dict)

    data = {
        "npz_str": npz_str,
        "cond_frames_idx": cond_frames_idx,
        "seq_slice": seq_slice,
    }
    logger.debug("Sending request to inbetween server... ")

    client = XClient('')
    try:
        response = client.post(inbetween_url, headers=headers, json=data)
        response.raise_for_status()
    except RequestException as e:
        logger.error(f"request_inbetween error: {str(e)}")
        raise e
    try:
        response_json = response.json()
        ret_motion = base64_str_to_npz(response_json)
    except Exception as e:
        logger.error(f"Failed to parse request_inbetween response: {str(e)}")
        raise e
    return ret_motion
