import os
import subprocess

videos = {
    "money": [
        "https://www.youtube.com/watch?v=mprpdh7mxPk&t=8s",
        "https://www.youtube.com/watch?v=zho2X2NTC8Q"
    ],
    "street": [
        "https://www.youtube.com/watch?v=NufyTUd3Paw",
        "https://www.youtube.com/watch?v=4hoWcyeKVp8",
        "https://www.youtube.com/watch?v=60ky3FHN5as",
        "https://www.youtube.com/watch?v=FAFZXDcaTiU"
    ]
}

def download_batch():
    for category, urls in videos.items():
        base_outdir = f"dataset/{category}_raw_frames"
        
        for i, url in enumerate(urls):
            outdir = os.path.join(base_outdir, f"video_{i+1}")
            os.makedirs(outdir, exist_ok=True)
            
            print(f"\n[{category.upper()}] Processing Video {i+1}/{len(urls)}: {url}")
            try:
                # We extract 1 frame per second (fps=1.0)
                cmd = ["python", "extract_youtube.py", "--url", url, "--fps", "1.0", "--outdir", outdir]
                subprocess.run(cmd, check=True)
            except Exception as e:
                print(f"Failed to process {url}: {e}")

if __name__ == "__main__":
    download_batch()
