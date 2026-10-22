"""
Configuration and logging for the lightweight Jarvis Laptop Agent.
Ensures minimal memory usage and rotating, capped local logs (< 5MB).
"""
import os
import sys
import logging
from logging.handlers import RotatingFileHandler

AGENT_VERSION = "1.0.0"

# Target backend URL
BACKEND_URL = os.environ.get("JARVIS_BACKEND_URL", "http://localhost:3000")

# Device credentials
DEVICE_ID = os.environ.get("JARVIS_DEVICE_ID", "default-laptop-dev")
DEVICE_TOKEN = os.environ.get("JARVIS_DEVICE_TOKEN", "dev-test-token-32-chars-long")

# Heartbeat interval in seconds
HEARTBEAT_INTERVAL = int(os.environ.get("JARVIS_HEARTBEAT_INTERVAL", "30"))

# Allowed base workspace directory for file operations (defaults to user home / JarvisWorkspace)
USER_HOME = os.path.expanduser("~")
DEFAULT_WORKSPACE = os.path.join(USER_HOME, "JarvisWorkspace")
ALLOWED_WORKSPACE = os.environ.get("JARVIS_WORKSPACE_DIR", DEFAULT_WORKSPACE)

# Ensure workspace and log directory exist
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(ALLOWED_WORKSPACE, exist_ok=True)

# Rotating file logger - Max 2MB per file, max 2 backups (Strictly capped at 4MB total disk usage)
LOG_FILE = os.path.join(LOG_DIR, "agent.log")

def setup_logger():
    logger = logging.getLogger("JarvisAgent")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        # Rotating file handler
        file_handler = RotatingFileHandler(
            LOG_FILE, maxBytes=2 * 1024 * 1024, backupCount=2, encoding="utf-8"
        )
        file_format = logging.Formatter(
            "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(file_format)
        logger.addHandler(console_handler)
        
    return logger

logger = setup_logger()
