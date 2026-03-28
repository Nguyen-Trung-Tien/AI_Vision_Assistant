import argparse
import shutil
from pathlib import Path

from merge_vnd_dataset import merge_datasets


def collect_sources(source_root: Path) -> list[Path]:
    if not source_root.exists():
        return []
    sources = []
    for item in sorted(source_root.iterdir()):
        if item.is_dir() and (item / "data.yaml").exists():
            sources.append(item)
    return sources


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Merge multiple Roboflow YOLO datasets into the canonical 29-class dataset."
    )
    parser.add_argument("--source-root", help="Folder containing multiple Roboflow datasets.")
    parser.add_argument("--source", help="Single Roboflow dataset folder (with data.yaml).")
    parser.add_argument("--target", default="dataset_roboflow", help="Target dataset folder.")
    parser.add_argument("--clean", action="store_true", help="Remove target folder before merge.")
    args = parser.parse_args()

    if not args.source_root and not args.source:
        raise ValueError("Provide --source-root or --source.")

    target = Path(args.target)
    if args.clean and target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)

    sources: list[Path] = []
    if args.source_root:
        sources.extend(collect_sources(Path(args.source_root)))
    if args.source:
        sources.append(Path(args.source))

    if not sources:
        raise FileNotFoundError("No valid datasets found.")

    print(f"[*] Merging {len(sources)} dataset(s) into {target}")
    for src in sources:
        print(f"    - {src}")
        merge_datasets(str(src), str(target))

    print("[+] Done.")


if __name__ == "__main__":
    main()
