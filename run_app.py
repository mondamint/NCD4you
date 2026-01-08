import subprocess
import time
import webbrowser
import os
import signal
import sys

def run_app():
    print("Starting Home NCD-NHH...")

    # Determine paths
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_cmd = [
        os.path.join(root_dir, "backend", "venv", "Scripts", "python"),
        "-m", "uvicorn", 
        "backend.main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8001"
    ]
    
    frontend_dir = os.path.join(root_dir, "frontend")
    frontend_cmd = ["npm", "run", "dev"]

    processes = []

    try:
        # Start Backend
        print("Starting Backend API...")
        backend_proc = subprocess.Popen(
            backend_cmd, 
            cwd=root_dir,
            shell=True # Needed for Windows usually to find executable if not full path, but here we gave full path. 
                       # However, for npm it might be needed. Let's try without shell=True for python if possible for better signal handling, 
                       # but on Windows shell=False is cleaner if we have full paths. 
                       # Let's use shell=False for python and shell=True for npm (cmd /c npm ...).
        )
        processes.append(backend_proc)

        # Start Frontend
        print("Starting Frontend Interface...")
        # On Windows, 'npm' is a batch file usually.
        frontend_proc = subprocess.Popen(
            frontend_cmd, 
            cwd=frontend_dir, 
            shell=True 
        )
        processes.append(frontend_proc)

        print("Waiting for services to initialize...")
        time.sleep(5)

        print("Opening Browser...")
        webbrowser.open("http://localhost:5173")

        print("\nApplication is running. Press Ctrl+C to stop.\n")
        
        # Keep main thread alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping application...")
    finally:
        for p in processes:
            try:
                # On Windows, terminate might not kill full tree if shell=True is used.
                # But basic terminate is a start.
                p.terminate()
            except Exception as e:
                print(f"Error killing process: {e}")
        print("Goodbye!")

if __name__ == "__main__":
    run_app()
