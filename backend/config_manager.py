import tkinter as tk
from tkinter import filedialog, messagebox
import json
import os
import sys

# Constants
CONFIG_FILE_NAME = "server_config.json"
FRONTEND_CONFIG_NAME = "config.js"

class ConfigManager(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Setting Connection (NCDs 4YOU)")
        self.geometry("500x350")
        self.resizable(False, False)

        # Style
        self.configure(bg="#f0f0f0")

        # Variables
        self.host_var = tk.StringVar(value="localhost")
        self.port_var = tk.StringVar(value="8001")
        self.db_path_var = tk.StringVar()

        # Load existing config if available
        self.load_config()

        self.create_widgets()

    def create_widgets(self):
        # Header
        header_frame = tk.Frame(self, bg="#3b82f6", height=60)
        header_frame.pack(fill="x")
        
        lbl_title = tk.Label(header_frame, text="ตั้งค่าการติดต่อกับระบบฐานข้อมูล", font=("Sarabun", 16, "bold"), bg="#3b82f6", fg="white")
        lbl_title.pack(pady=10)

        # Main Content
        main_frame = tk.Frame(self, bg="#f0f0f0", padx=20, pady=20)
        main_frame.pack(fill="both", expand=True)

        # Host
        tk.Label(main_frame, text="Host / IP:", bg="#f0f0f0", font=("Sarabun", 10)).grid(row=0, column=0, sticky="w", pady=5)
        ent_host = tk.Entry(main_frame, textvariable=self.host_var, font=("Sarabun", 10), width=30)
        ent_host.grid(row=0, column=1, sticky="w", pady=5)
        tk.Button(main_frame, text="Auto Set (Local)", command=self.set_local, font=("Sarabun", 8)).grid(row=0, column=2, padx=5)

        # Port
        tk.Label(main_frame, text="Port:", bg="#f0f0f0", font=("Sarabun", 10)).grid(row=1, column=0, sticky="w", pady=5)
        ent_port = tk.Entry(main_frame, textvariable=self.port_var, font=("Sarabun", 10), width=10)
        ent_port.grid(row=1, column=1, sticky="w", pady=5)

        # Database
        tk.Label(main_frame, text="Database File:", bg="#f0f0f0", font=("Sarabun", 10)).grid(row=2, column=0, sticky="w", pady=5)
        ent_db = tk.Entry(main_frame, textvariable=self.db_path_var, font=("Sarabun", 10), width=30)
        ent_db.grid(row=2, column=1, sticky="w", pady=5)
        tk.Button(main_frame, text="...", command=self.browse_db, font=("Sarabun", 8)).grid(row=2, column=2, padx=5)

        # Buttons
        btn_frame = tk.Frame(self, bg="#f0f0f0", pady=20)
        btn_frame.pack(fill="x")
        
        tk.Button(btn_frame, text="บันทึก (Save)", command=self.save_config, bg="#22c55e", fg="white", font=("Sarabun", 10, "bold"), width=15).pack(side="right", padx=20)
        tk.Button(btn_frame, text="ยกเลิก (Close)", command=self.destroy, bg="#ef4444", fg="white", font=("Sarabun", 10), width=10).pack(side="right")

    def set_local(self):
        self.host_var.set("localhost")
        self.port_var.set("8001")

    def browse_db(self):
        filename = filedialog.askopenfilename(
            title="Select Database File",
            filetypes=(("SQLite Database", "*.db"), ("All Files", "*.*")),
            initialdir=os.getcwd()
        )
        if filename:
            self.db_path_var.set(filename)

    def load_config(self):
        # 1. Load Backend Config
        if os.path.exists(CONFIG_FILE_NAME):
            try:
                with open(CONFIG_FILE_NAME, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if "db_path" in data:
                        self.db_path_var.set(data["db_path"])
            except Exception as e:
                print(f"Error loading backend config: {e}")
        else:
            # Default to checking ncd_app.db in current dir
            default_db = os.path.join(os.getcwd(), "ncd_app.db")
            if os.path.exists(default_db):
                self.db_path_var.set(default_db)

        # 2. Load Frontend Config (Try to read from config.js)
        # We look in 'static_ui' or 'frontend/dist' or 'frontend/public'
        config_path = self.find_frontend_config_path()
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Parse simple JS: window.globalConfig = { "API_URL": "http://localhost:8001" };
                    if '"API_URL":' in content:
                        import re
                        match = re.search(r'"API_URL"\s*:\s*"http://([^:]+):(\d+)"', content)
                        if match:
                            self.host_var.set(match.group(1))
                            self.port_var.set(match.group(2))
            except Exception as e:
                print(f"Error loading frontend config: {e}")

    def find_frontend_config_path(self):
        # Priority: 
        # 1. ./static_ui/config.js (Production/Exe structure often uses this if we extract there, but actually we need it external?)
        # 2. ./frontend/dist/config.js (Production common)
        # 3. ./frontend/public/config.js (Dev)
        # 4. ./config.js (Root - ideal for simple external config)
        
        candidates = [
            "config.js",
            "frontend/dist/config.js",
            "frontend/public/config.js",
            "static_ui/config.js"
        ]
        
        # return the first one that exists, or default to config.js if none
        for c in candidates:
            if os.path.exists(c):
                return c
        return "config.js" 

    def save_config(self):
        host = self.host_var.get().strip()
        port = self.port_var.get().strip()
        db_path = self.db_path_var.get().strip()

        if not host or not port:
            messagebox.showerror("Error", "Host and Port are required.")
            return

        # 1. Save Backend Config
        backend_data = {"db_path": db_path}
        try:
            with open(CONFIG_FILE_NAME, 'w', encoding='utf-8') as f:
                json.dump(backend_data, f, indent=4)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save backend config: {e}")
            return

        # 2. Save Frontend Config
        # We will write to 'config.js' in the root AND try to copy/write to other locations if they exist
        config_content = f'window.globalConfig = {{ "API_URL": "http://{host}:{port}" }};'
        
        paths_to_write = ["config.js"] # Always write to root config.js
        
        # Also update development/build paths if they exist
        if os.path.exists("frontend/public"):
            paths_to_write.append("frontend/public/config.js")
        if os.path.exists("frontend/dist"):
            paths_to_write.append("frontend/dist/config.js")
            
        success_count = 0
        for path in paths_to_write:
            try:
                # Ensure directory exists if path has dirs
                if os.path.dirname(path):
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(config_content)
                success_count += 1
            except Exception as e:
                print(f"Warning: Could not write to {path}: {e}")

        if success_count > 0:
            messagebox.showinfo("Success", "บันทึกข้อมูลเรียบร้อยแล้ว\nกรุณารีสตาร์ทโปรแกรมเพื่อเริ่มการทำงานใหม่")
            self.destroy()
        else:
            messagebox.showerror("Error", "Failed to write any frontend config files.")

if __name__ == "__main__":
    app = ConfigManager()
    app.mainloop()
