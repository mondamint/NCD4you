from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production mode: Use PostgreSQL from environment variable (Supabase/Railway)
    print(f"DEBUG: Using PostgreSQL from DATABASE_URL")
    SQLALCHEMY_DATABASE_URL = DATABASE_URL

    # Create engine for PostgreSQL
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

else:
    # Development mode: Use SQLite (local development)
    print(f"DEBUG: DATABASE_URL not found, using SQLite for local development")

    # Get absolute path of this file's directory
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle, the PyInstaller bootloader
        # extends the sys module by a flag frozen=True and sets the app
        # path into variable _MEIPASS'.
        # However, we want the DB to be external (next to the EXE), not internal temp.
        # So we use sys.executable to find the folder where .exe lives.
        BASE_DIR = os.path.dirname(sys.executable)
    else:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    print(f"DEBUG: Database Base Directory: {BASE_DIR}")

    # Check for external config
    CONFIG_PATH = os.path.join(BASE_DIR, "server_config.json")
    DB_PATH = os.path.join(BASE_DIR, "ncd_app.db") # Default

    if os.path.exists(CONFIG_PATH):
        import json
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                config = json.load(f)
                if "db_path" in config and config["db_path"]:
                    DB_PATH = config["db_path"]
                    print(f"DEBUG: Loaded DB Path from config: {DB_PATH}")
        except Exception as e:
            print(f"ERROR: Failed to load server_config.json: {e}")

    print(f"DEBUG: Final Database Path: {DB_PATH}")
    if os.path.exists(DB_PATH):
        print("DEBUG: Database file FOUND.")
    else:
        print("DEBUG: Database file NOT FOUND.")

    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

    # Create engine for SQLite
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
