"""
Application and URL launcher command handler for Windows.
Strictly allowlisted applications only; no arbitrary shell execution.
"""
import os
import subprocess
import webbrowser
from typing import Dict, Any
from src.security import validate_app_name, validate_url
from src.config import logger

def execute_launch_app(payload: Dict[str, Any]) -> Dict[str, Any]:
    app_name = payload.get("app_name", "")
    valid, executable = validate_app_name(app_name)
    
    if not valid:
        return {
            "status": "error",
            "message": f"Application '{app_name}' is not in the approved application allowlist."
        }
        
    try:
        # Use os.startfile on Windows for native apps, or subprocess.Popen
        if hasattr(os, "startfile"):
            os.startfile(executable)
        else:
            subprocess.Popen([executable])
            
        logger.info(f"Successfully launched approved application: {executable}")
        return {
            "status": "success",
            "message": f"Application '{app_name}' launched successfully on your laptop."
        }
    except Exception as e:
        logger.error(f"Failed to launch {executable}: {e}")
        return {
            "status": "error",
            "message": f"Failed to launch application: {str(e)}"
        }

def execute_open_url(payload: Dict[str, Any]) -> Dict[str, Any]:
    url = payload.get("url", "")
    if not validate_url(url):
        return {
            "status": "error",
            "message": "Invalid or disallowed URL. Must be a valid http:// or https:// web address."
        }
        
    try:
        webbrowser.open(url)
        logger.info(f"Successfully opened URL: {url}")
        return {
            "status": "success",
            "message": f"URL '{url}' opened in default browser."
        }
    except Exception as e:
        logger.error(f"Failed to open URL {url}: {e}")
        return {
            "status": "error",
            "message": f"Failed to open URL: {str(e)}"
        }
