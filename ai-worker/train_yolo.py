import argparse
import os
from pathlib import Path

from ultralytics import YOLO


def _find_checkpoint(run_name: str, prefer: str = "best") -> str | None:
    """Return checkpoint path inside runs/detect/<run_name>/weights."""
    weights_dir = Path("runs") / "detect" / run_name / "weights"
    first = weights_dir / f"{prefer}.pt"
    second = weights_dir / ("last.pt" if prefer == "best" else "best.pt")

    if first.exists():
        return str(first)
    if second.exists():
        return str(second)
    return None


def train_custom_model(
    dataset_yaml_path: str = "dataset/data.yaml",
    epochs: int = 50,
    imgsz: int = 640,
    model_version: str = "yolo11n.pt",
    run_name: str = "vision_assistant_model",
    device: str = "cpu",
    batch: int = 16,
    workers: int = 0,
    mode: str = "scratch",
    checkpoint: str | None = None,
    lr0: float | None = None,
) -> None:
    """
    Train YOLO with 3 modes:
    - scratch: train from pretrained backbone (model_version)
    - finetune: continue learning from checkpoint (best.pt/last.pt)
    - resume: resume interrupted run from last.pt
    """
    if not os.path.exists(dataset_yaml_path):
        print(f"[ERROR] Dataset yaml not found: {dataset_yaml_path}")
        return

    mode = mode.lower().strip()
    if mode not in {"scratch", "finetune", "resume"}:
        print(f"[ERROR] Unsupported mode: {mode}")
        return

    print("[*] Training configuration")
    print(f"    mode={mode}")
    print(f"    data={dataset_yaml_path}")
    print(f"    epochs={epochs}, imgsz={imgsz}, batch={batch}, workers={workers}, device={device}")
    print(f"    run_name={run_name}")

    try:
        if mode == "resume":
            resume_ckpt = checkpoint or _find_checkpoint(run_name, prefer="last")
            if not resume_ckpt:
                print(f"[ERROR] No checkpoint found to resume for run '{run_name}'.")
                print("        Expected: runs/detect/<run_name>/weights/last.pt")
                return

            print(f"[*] Resuming from checkpoint: {resume_ckpt}")
            model = YOLO(resume_ckpt)
            model.train(resume=True, device=device)
            print("[+] Resume training completed.")
            return

        start_model = model_version
        if mode == "finetune":
            start_model = checkpoint or _find_checkpoint(run_name, prefer="best") or model_version
            print(f"[*] Fine-tune from: {start_model}")
        else:
            print(f"[*] Train from base model: {start_model}")

        train_kwargs = {
            "data": dataset_yaml_path,
            "epochs": epochs,
            "imgsz": imgsz,
            "device": device,
            "plots": True,
            "name": run_name,
            "batch": batch,
            "workers": workers,
        }
        if lr0 is not None:
            train_kwargs["lr0"] = lr0

        model = YOLO(start_model)
        model.train(**train_kwargs)

        print("[+] Training completed.")
        print(f"[*] Best weights: runs/detect/{run_name}/weights/best.pt")

    except Exception as exc:
        print(f"[ERROR] Training failed: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLO training with scratch/finetune/resume modes")
    parser.add_argument("--mode", choices=["scratch", "finetune", "resume"], default="scratch")
    parser.add_argument("--dataset", default="dataset/data.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--model", default="yolo11n.pt")
    parser.add_argument("--run-name", default="vision_assistant_model")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--workers", type=int, default=0)
    parser.add_argument("--checkpoint", default=None)
    parser.add_argument("--lr0", type=float, default=None)
    args = parser.parse_args()

    train_custom_model(
        dataset_yaml_path=args.dataset,
        epochs=args.epochs,
        imgsz=args.imgsz,
        model_version=args.model,
        run_name=args.run_name,
        device=args.device,
        batch=args.batch,
        workers=args.workers,
        mode=args.mode,
        checkpoint=args.checkpoint,
        lr0=args.lr0,
    )
