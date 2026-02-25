import cv2
import os
import subprocess
import argparse
import glob

def download_youtube_video(url, output_prefix="temp_youtube_video"):
    print(f"[1/2] Downloading YouTube video: {url}")
    # Remove old temp files
    for old_file in glob.glob(f"{output_prefix}.*"):
        os.remove(old_file)
        
    command = [
        "yt-dlp",
        "-f", "best",
        "-o", f"{output_prefix}.%(ext)s",
        url
    ]
    subprocess.run(command, check=True)
    
    # Find the actual downloaded file (since extension can be .mp4, .mkv, .webm)
    downloaded_files = glob.glob(f"{output_prefix}.*")
    if not downloaded_files:
        raise FileNotFoundError("yt-dlp failed to save any video file.")
    
    print(f"Download complete: {downloaded_files[0]}")
    return downloaded_files[0]

def extract_frames(video_path, output_dir="frames", fps_extract=1):
    print(f"[2/2] Extracting frames (1 frame per {1/fps_extract} seconds) to '{output_dir}/'...")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0:
        video_fps = 30 # Default safe fallback
    
    # Calculate how many frames to skip to achieve desired extracting fps
    frame_jump = int(round(video_fps / fps_extract))
    
    count = 0
    saved_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if count % frame_jump == 0:
            frame_name = os.path.join(output_dir, f"frame_{saved_count:05d}.jpg")
            cv2.imwrite(frame_name, frame)
            saved_count += 1
            if saved_count % 50 == 0:
                print(f"  -> Extracted {saved_count} frames so far...")
                
        count += 1

    cap.release()
    print(f"Extraction complete! Total {saved_count} frames saved to '{os.path.abspath(output_dir)}'.")

if __name__ == "__main__":
    # You can change these variables or pass them via command line (left hardcoded for simplicity right now)
    # Example URL for a walking tour or POV driving in Vietnam:
    YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" # Replace this URL!
    
    parser = argparse.ArgumentParser(description="Download YouTube video and extract frames.")
    parser.add_argument("--url", type=str, required=True, help="YouTube video URL")
    parser.add_argument("--fps", type=float, default=1.0, help="Frames per second to extract (default: 1.0)")
    parser.add_argument("--outdir", type=str, default="frames", help="Output directory for frames")
    
    args = parser.parse_args()
    
    video_file = "temp_youtube_video"
    actual_file = ""
    try:
        actual_file = download_youtube_video(args.url, video_file)
        extract_frames(actual_file, args.outdir, args.fps)
    finally:
        # Cleanup video file to save disk space
        if actual_file and os.path.exists(actual_file):
            print(f"Cleaning up {actual_file}...")
            os.remove(actual_file)
