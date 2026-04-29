import argparse
import runpy
import sys
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--output-temp")
    return parser.parse_args(argv)


def run_script(script_path: Path, extra_args: list[str]) -> None:
    old_argv = sys.argv[:]
    try:
        sys.argv = [str(script_path), "--", *extra_args]
        runpy.run_path(str(script_path), run_name="__main__")
    finally:
        sys.argv = old_argv


def main():
    args = parse_args()
    root = Path(__file__).resolve().parent
    config = Path(args.config)

    run_script(root / "generate_idle_base_v1.py", ["--config", str(config)])
    run_script(root / "generate_idle_face_v1.py", ["--config", str(config)])

    current = Path(bpy.data.filepath)
    temp_path = Path(args.output_temp) if args.output_temp else current.with_name(current.stem + ".rebuilt.blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(temp_path), copy=False)
    print(f"SAVED_TEMP {temp_path}")


if __name__ == "__main__":
    main()
