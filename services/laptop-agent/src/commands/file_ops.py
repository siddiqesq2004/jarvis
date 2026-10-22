"""
Sandboxed file operations handler.
All operations are strictly confined to the user-approved ALLOWED_WORKSPACE.
"""
import os
from typing import Dict, Any
from src.security import validate_safe_path
from src.config import ALLOWED_WORKSPACE, logger

MAX_READ_BYTES = 100 * 1024  # 100 KB limit to prevent RAM pressure

def execute_list_files(payload: Dict[str, Any]) -> Dict[str, Any]:
    subpath = payload.get("subpath", "")
    valid, target_dir = validate_safe_path(subpath)
    if not valid:
        return {"status": "error", "message": target_dir}

    if not os.path.exists(target_dir):
        return {"status": "error", "message": "Directory does not exist."}

    if not os.path.isdir(target_dir):
        return {"status": "error", "message": "Specified path is not a directory."}

    try:
        items = []
        for entry in os.scandir(target_dir):
            items.append({
                "name": entry.name,
                "is_dir": entry.is_dir(),
                "size_bytes": entry.stat().st_size if entry.is_file() else 0
            })
        return {
            "status": "success",
            "workspace": ALLOWED_WORKSPACE,
            "directory": subpath or "/",
            "items": items
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to list directory: {str(e)}"}

def execute_read_file(payload: Dict[str, Any]) -> Dict[str, Any]:
    filename = payload.get("filename", "")
    valid, file_path = validate_safe_path(filename)
    if not valid:
        return {"status": "error", "message": file_path}

    if not os.path.exists(file_path):
        return {"status": "error", "message": f"File '{filename}' not found."}

    if not os.path.isfile(file_path):
        return {"status": "error", "message": "Path is not a regular file."}

    if os.path.getsize(file_path) > MAX_READ_BYTES:
        return {
            "status": "error",
            "message": f"File exceeds maximum allowed read size of {MAX_READ_BYTES // 1024} KB."
        }

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {
            "status": "success",
            "filename": filename,
            "content": content
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to read file: {str(e)}"}

def execute_create_file(payload: Dict[str, Any]) -> Dict[str, Any]:
    filename = payload.get("filename", "")
    content = payload.get("content", "")
    
    valid, file_path = validate_safe_path(filename)
    if not valid:
        return {"status": "error", "message": file_path}

    # Ensure parent directory exists within safe workspace
    parent_dir = os.path.dirname(file_path)
    os.makedirs(parent_dir, exist_ok=True)

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"Created file: {file_path}")
        return {
            "status": "success",
            "filename": filename,
            "bytes_written": len(content.encode("utf-8")),
            "message": f"File '{filename}' created successfully in workspace."
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to create file: {str(e)}"}
