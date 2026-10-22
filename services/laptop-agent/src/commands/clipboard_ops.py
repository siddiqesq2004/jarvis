"""
Clipboard command handler for Windows.
Copies approved text to the system clipboard using native clip.exe.
"""
import subprocess
from typing import Dict, Any
from src.config import logger

def execute_copy_clipboard(payload: Dict[str, Any]) -> Dict[str, Any]:
    text = payload.get("text", "")
    if not isinstance(text, str):
        return {"status": "error", "message": "Text payload must be a string."}

    try:
        # Use Windows native clip.exe without shell=True
        process = subprocess.Popen(
            ["clip"], stdin=subprocess.PIPE, close_fds=True
        )
        process.communicate(input=text.encode("utf-16le"))
        logger.info(f"Copied {len(text)} characters to clipboard.")
        return {
            "status": "success",
            "message": "Text successfully copied to laptop clipboard.",
            "character_count": len(text)
        }
    except Exception as e:
        logger.error(f"Failed to copy to clipboard: {e}")
        return {
            "status": "error",
            "message": f"Clipboard operation failed: {str(e)}"
        }
