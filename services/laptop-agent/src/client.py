"""
HTTP client for communicating with the Jarvis backend.
Sends authenticated heartbeats, fetches queued commands, and posts execution results.
Supports both requests (if installed) and Python standard urllib.request.
"""
import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from src.config import BACKEND_URL, DEVICE_ID, DEVICE_TOKEN, logger

class JarvisBackendClient:
    def __init__(self, base_url: str = BACKEND_URL, device_id: str = DEVICE_ID, token: str = DEVICE_TOKEN):
        self.base_url = base_url.rstrip("/")
        self.device_id = device_id
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Device-Id": self.device_id,
            "Content-Type": "application/json",
            "User-Agent": "JarvisLaptopAgent/1.0.0"
        }
        self.backoff_delay = 5
        self.max_backoff = 60

    def _http_request(self, method: str, url: str, data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Makes an authenticated HTTP request using standard urllib."""
        encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=encoded_data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                logger.error(f"Authentication failed (HTTP {e.code}): Device token invalid or revoked.")
            else:
                logger.warning(f"Backend returned HTTP {e.code}: {e.reason}")
            return None
        except Exception as e:
            logger.debug(f"HTTP connection error to {url}: {e}")
            return None

    def send_heartbeat(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Sends an authenticated heartbeat to the backend."""
        endpoint = f"{self.base_url}/api/devices/heartbeat"
        resp = self._http_request("POST", endpoint, data=payload)
        if resp:
            self.backoff_delay = 5
        else:
            time.sleep(self.backoff_delay)
            self.backoff_delay = min(self.backoff_delay * 2, self.max_backoff)
        return resp

    def fetch_pending_commands(self) -> List[Dict[str, Any]]:
        """Retrieves authorized commands queued for this device."""
        endpoint = f"{self.base_url}/api/devices/commands?device_id={self.device_id}"
        resp = self._http_request("GET", endpoint)
        if resp and isinstance(resp, dict):
            return resp.get("commands", [])
        return []

    def report_command_result(self, command_id: str, status: str, result: Dict[str, Any], error_message: Optional[str] = None):
        """Reports the actual verified execution result to the backend."""
        endpoint = f"{self.base_url}/api/devices/commands"
        payload = {
            "command_id": command_id,
            "device_id": self.device_id,
            "status": status,
            "result": result,
            "error_message": error_message
        }
        resp = self._http_request("PATCH", endpoint, data=payload)
        if resp:
            logger.info(f"Reported result for command {command_id}: status={status}")
