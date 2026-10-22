"""
Screenshot command handler.
Takes screenshot ONLY after explicit user authorization in the PWA/dashboard.
Compresses and limits resolution to minimize memory and bandwidth.
"""
import io
import base64
from typing import Dict, Any
from src.config import logger

def execute_screenshot(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Require explicit confirmation flag in payload
    if not payload.get("user_confirmed"):
        return {
            "status": "error",
            "message": "Screenshot rejected: Explicit user confirmation was not provided."
        }

    try:
        from PIL import ImageGrab
        # Capture screen
        screenshot = ImageGrab.grab()
        
        # Resize to max 1280px width to keep lightweight and fast
        max_width = 1280
        if screenshot.width > max_width:
            ratio = max_width / float(screenshot.width)
            new_height = int(float(screenshot.height) * float(ratio))
            screenshot = screenshot.resize((max_width, new_height))

        # Save to compressed JPEG in memory buffer (no persistent disk image)
        buffer = io.BytesIO()
        screenshot.convert("RGB").save(buffer, format="JPEG", quality=75)
        buffer.seek(0)
        
        encoded = base64.b64encode(buffer.read()).decode("utf-8")
        logger.info("Screenshot successfully captured and compressed.")
        
        return {
            "status": "success",
            "format": "image/jpeg",
            "image_base64": encoded,
            "message": "Screenshot captured with user authorization."
        }
    except Exception as e:
        logger.error(f"Failed to capture screenshot: {e}")
        return {
            "status": "error",
            "message": f"Screenshot failed: {str(e)}"
        }
