from ultralytics import YOLO

model = YOLO('runs/detect/vision_assistant_model3/weights/best.pt')
print(model.names)
