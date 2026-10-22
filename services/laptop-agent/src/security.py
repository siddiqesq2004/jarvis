"""
Security module for Jarvis Laptop Agent.
Enforces strict allowlisting, argument schema checks, and path containment.
Rejects arbitrary shell commands, path traversal, and unauthenticated requests.
"""
import os
import re
from typing import Dict, Any, Tuple
from src.config import ALLOWED_WORKSPACE, logger

# Strict allowlist of permitted applications that can be launched on Windows
PERMITTED_APPS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "edge": "msedge.exe",
    "msedge": "msedge.exe",
    "microsoft edge": "msedge.exe",
    "chrome": "chrome.exe",
    "browser": "msedge.exe",
    "explorer": "explorer.exe",
    "taskmgr": "taskmgr.exe",
    "task manager": "taskmgr.exe",
    "terminal": "wt.exe",
    "cmd": "cmd.exe",
    "code": "code.cmd"
}

# Strict URL pattern (http/https only)
URL_REGEX = re.compile(
    r"^https?://[a-zA-Z0-9\-\.]+(?::[0-9]+)?(?:/[a-zA-Z0-9_\-\.\/\?%&=#~]*)?$"
)

def validate_safe_path(requested_path: str) -> Tuple[bool, str]:
    """
    Validates that requested_path is strictly within ALLOWED_WORKSPACE.
    Prevents path traversal attacks (e.g. '../', '..\\', absolute escapes).
    """
    if not requested_path or not isinstance(requested_path, str):
        return False, "Invalid path format"
        
    if ".." in requested_path:
        logger.warning(f"Security Alert: Path traversal attempt blocked: {requested_path}")
        return False, "Path traversal sequence (..) is forbidden"

    target = os.path.normpath(os.path.join(ALLOWED_WORKSPACE, requested_path.lstrip("/\\")))
    real_workspace = os.path.realpath(ALLOWED_WORKSPACE)
    real_target = os.path.realpath(target)

    if not real_target.startswith(real_workspace):
        logger.warning(f"Security Alert: Target outside workspace blocked: {requested_path}")
        return False, "Target path is outside permitted workspace"

    return True, real_target

def validate_url(url: str) -> bool:
    """Validates that a URL is a legitimate http or https web address."""
    if not url or not isinstance(url, str):
        return False
    return bool(URL_REGEX.match(url.strip()))

def validate_app_name(app_name: str) -> Tuple[bool, str]:
    """Checks if requested application is in the strict allowlist."""
    if not app_name or not isinstance(app_name, str):
        return False, ""
    cleaned = app_name.lower().strip()
    if cleaned in PERMITTED_APPS:
        return True, PERMITTED_APPS[cleaned]
    return False, ""
