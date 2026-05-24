import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognitionService:
    _app = None

    @classmethod
    def _get_app(cls):
        if cls._app is None:
            # Initialize InsightFace with detection and recognition
            # providers=['CPUExecutionProvider'] for better compatibility on Windows
            cls._app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            cls._app.prepare(ctx_id=0, det_size=(640, 640))
        return cls._app

    @classmethod
    def get_face_embeddings(cls, image_bytes: bytes):
        """
        Detects faces in an image and returns a list of embeddings.
        Returns: list of dicts {'name': 'unknown', 'embedding': np.array, 'bbox': [x1, y1, x2, y2]}
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        app = cls._get_app()
        faces = app.get(img)

        results = []
        for face in faces:
            results.append(
                {
                    "embedding": face.normed_embedding,
                    "bbox": face.bbox.astype(int).tolist(),
                    "score": float(face.det_score),
                }
            )
        return results

    @staticmethod
    def cosine_similarity(feat1, feat2):
        return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2))

    @classmethod
    def recognize_face_detailed(cls, image_bytes: bytes, known_faces: list, threshold=0.4):
        """
        known_faces: list of {'name': str, 'embedding': np.array}
        Returns: list of detected face dicts and image size
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return [], 0, 0
            
        height, width = img.shape[:2]
        
        app = cls._get_app()
        faces = app.get(img)
        
        results = []
        for face in faces:
            best_match = "unknown"
            max_sim = -1
            
            for known in known_faces:
                sim = cls.cosine_similarity(face.normed_embedding, known["embedding"])
                if sim > max_sim:
                    max_sim = sim
                    best_match = known["name"]
                    
            if max_sim >= threshold:
                name = best_match
            else:
                name = "unknown"
                
            results.append({
                "name": name,
                "bbox": face.bbox.astype(int).tolist(),
                "score": float(face.det_score)
            })
            
        return results, width, height

    @classmethod
    def recognize_face(cls, image_bytes: bytes, known_faces: list, threshold=0.4):
        """
        known_faces: list of {'name': str, 'embedding': np.array}
        Returns: list of detected names
        """
        faces_info, _, _ = cls.recognize_face_detailed(image_bytes, known_faces, threshold)
        return [f["name"] for f in faces_info]
