from packaging import version


def compare_versions_str(version1: str, version2: str) -> int | None:
    try:
        v1 = version.parse(version1)
        v2 = version.parse(version2)
    except ValueError:
        return None
    if v1 < v2:
        return -1
    elif v1 > v2:
        return 1
    else:
        return 0
