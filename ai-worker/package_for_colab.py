import argparse
import shutil
from pathlib import Path


ESSENTIAL_FILES = [
    "requirements.txt",
    "train_yolo.py",
    "merge_vnd_dataset.py",
    "prepare_dataset_from_roboflow.py",
    "COLAB_TRAINING.md",
    "yolo11n.pt",
]


def _safe_copytree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def build_bundle(
    output_zip: Path,
    include_roboflow: bool,
    include_merged: bool,
    clean: bool,
) -> None:
    here = Path(__file__).resolve().parent
    bundle_root = here / "_colab_bundle"

    if clean and bundle_root.exists():
        shutil.rmtree(bundle_root)
    bundle_root.mkdir(parents=True, exist_ok=True)

    copied = []
    for name in ESSENTIAL_FILES:
        src = here / name
        if src.exists():
            shutil.copy2(src, bundle_root / name)
            copied.append(name)

    if include_roboflow:
        src = here / "dataset_image"
        if src.exists():
            _safe_copytree(src, bundle_root / "dataset_image")
            copied.append("dataset_image/*")

    if include_merged:
        src = here / "dataset_roboflow"
        if src.exists():
            _safe_copytree(src, bundle_root / "dataset_roboflow")
            copied.append("dataset_roboflow/*")

    output_zip.parent.mkdir(parents=True, exist_ok=True)
    base_name = output_zip.with_suffix("")
    if output_zip.exists():
        output_zip.unlink()
    shutil.make_archive(str(base_name), "zip", root_dir=bundle_root)

    print("[+] Colab bundle created:")
    print(f"    - {output_zip}")
    if copied:
        print("[+] Included:")
        for item in copied:
            print(f"    - {item}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Package training files into a Colab-ready zip.")
    parser.add_argument(
        "--output",
        default=None,
        help="Output zip path. Default: <repo_root>/colab_train_bundle.zip",
    )
    parser.add_argument(
        "--include-roboflow",
        action="store_true",
        help="Include dataset_image (Roboflow exports).",
    )
    parser.add_argument(
        "--include-merged",
        action="store_true",
        help="Include dataset_roboflow (merged dataset).",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove existing _colab_bundle before building.",
    )
    args = parser.parse_args()

    here = Path(__file__).resolve().parent
    repo_root = here.parent
    output_zip = Path(args.output) if args.output else repo_root / "colab_train_bundle.zip"

    build_bundle(
        output_zip=output_zip,
        include_roboflow=args.include_roboflow,
        include_merged=args.include_merged,
        clean=args.clean,
    )


if __name__ == "__main__":
    main()
