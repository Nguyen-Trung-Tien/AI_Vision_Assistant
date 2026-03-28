# Retrain YOLO on Google Colab

This project uses the following canonical class order:

0. car
1. truck
2. chair
3. manhole
4. person
5. phone
6. road
7. sidewalk
8. stairs_down
9. stairs_up
10. water_bottle
11. money

## 1) Open Colab and enable GPU

- Runtime -> Change runtime type -> Hardware accelerator: `GPU`

## 2) Bring source code to Colab

Option A (recommended): clone repo

```bash
%cd /content
!git clone <YOUR_REPO_URL> vision-assistant
%cd /content/vision-assistant/ai-worker
```

Option B: upload zip of `Vision Assistant` project and unzip

```bash
%cd /content
!unzip -q "Vision Assistant.zip" -d /content
%cd "/content/Vision Assistant/ai-worker"
```

## 3) Install dependencies

```bash
!pip install -r requirements.txt
```

## 4) Build dataset

### Option A: From Roboflow exports (`data_image/*`)

Use this when your datasets are downloaded from `universe.roboflow.com`.

```bash
!python prepare_dataset_from_roboflow.py \
  --source-root data_image \
  --dataset-root dataset_roboflow \
  --test-policy train \
  --include-existing-dataset \
  --existing-dataset-root dataset \
  --clean
```

Notes:
- Script merges multiple Roboflow datasets and remaps labels to project classes.
- Unknown/unwanted classes (for example `dog`, `green/red/yellow`) are skipped by design.
- Existing local dataset is optional but recommended to reduce forgetting old classes.

### Option B: From class folders (`image_*`) - legacy flow

```bash
!python prepare_dataset_from_images.py --source-root image --dataset-root dataset --clean
```

## 5) Train YOLO

### Recommended: fine-tune from latest checkpoint

```bash
!python train_yolo.py \
  --mode finetune \
  --dataset dataset_roboflow/data.yaml \
  --epochs 80 \
  --imgsz 640 \
  --model yolo11n.pt \
  --device 0 \
  --batch 16 \
  --workers 2 \
  --run-name vision_assistant_model_v3
```

If you want to start from scratch:

```bash
!python train_yolo.py \
  --mode scratch \
  --dataset dataset_roboflow/data.yaml \
  --epochs 80 \
  --imgsz 640 \
  --model yolo11n.pt \
  --device 0 \
  --batch 16 \
  --workers 2 \
  --run-name vision_assistant_model_v3
```

## 6) Download trained model

```bash
from google.colab import files
files.download('/content/vision-assistant/ai-worker/runs/detect/vision_assistant_model_v3/weights/best.pt')
```

## 7) Put model back into app

Copy `best.pt` to:

- `ai-worker/runs/detect/vision_assistant_model_v3/weights/best.pt`

Then add this candidate with highest priority in `services/model_manager.py`.
