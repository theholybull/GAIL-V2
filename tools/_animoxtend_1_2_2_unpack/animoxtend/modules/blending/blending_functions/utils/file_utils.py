import io
import logging
from typing import List

import numpy as np

logger = logging.getLogger("animoxtend")


def npz_bytes_to_base64_str(npz_bytes: bytes) -> str:
    import base64

    return base64.b64encode(npz_bytes).decode("utf-8")


def base64_str_to_npz_bytes(base64_str: bytes) -> bytes:
    import base64

    return base64.b64decode(base64_str)


def npz_to_base64_str(npz_dict: dict) -> str:
    import numpy as np

    buff_io = io.BytesIO()
    np.savez_compressed(buff_io, **npz_dict)
    buff_io.seek(0)
    return npz_bytes_to_base64_str(buff_io.read())


def base64_str_to_npz(base64_str: str) -> dict:
    import numpy as np

    try:
        npz_bytes = base64_str_to_npz_bytes(base64_str)
        npz_dict = np.load(io.BytesIO(npz_bytes), allow_pickle=True)
        return dict(npz_dict)

    except ValueError as e:
        logger.error(f"Decoding error: {e}")
        raise ValueError("Failed to decode Base64 string") from e


def dict_to_npz_io(npz_dict: dict) -> io.BytesIO:
    buff_io = io.BytesIO()

    import numpy as np

    np.savez_compressed(buff_io, **npz_dict)
    buff_io.seek(0)
    return buff_io


##### npz dict funcs #####
def concat_npz_dict(npz_dict_list: List[dict]) -> dict:
    ret_dict = npz_dict_list[0].copy()

    all_transl = [npz_dict['transl'] for npz_dict in npz_dict_list]
    all_rotmat = [npz_dict['rotmat'] for npz_dict in npz_dict_list]

    all_transl = np.concatenate(all_transl, axis=0)
    all_rotmat = np.concatenate(all_rotmat, axis=0)

    ret_dict['transl'] = all_transl
    ret_dict['rotmat'] = all_rotmat
    ret_dict['len'] = int(all_transl.shape[0])

    return ret_dict
