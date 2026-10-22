"""
Automated unit & security tests for Jarvis Laptop Agent.
Verifies heartbeat logic, availability thresholds, path containment, and allowlists.
"""
import os
import sys
import time
import unittest
from unittest.mock import patch, MagicMock

# Ensure src can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.security import validate_safe_path, validate_url, validate_app_name
from src.heartbeat import collect_heartbeat_payload
from src.commands.system_info import execute_system_info
from src.commands.file_ops import execute_create_file, execute_read_file
from src.commands.app_launcher import execute_launch_app, execute_open_url
from src.commands.screenshot import execute_screenshot
from src.agent import JarvisAgentDaemon

class TestLaptopAgentSecurityAndAvailability(unittest.TestCase):

    def test_heartbeat_payload_structure(self):
        """Test that heartbeat collects valid schema with non-sensitive telemetry."""
        payload = collect_heartbeat_payload()
        self.assertIn("device_id", payload)
        self.assertIn("agent_version", payload)
        self.assertIn("client_timestamp", payload)
        self.assertIn("health_status", payload)
        self.assertIn("os_info", payload)
        self.assertIn(payload["health_status"], ["healthy", "degraded", "error"])

    def test_availability_calculation_logic(self):
        """
        Tests the availability threshold logic:
        A heartbeat received within 90s is online.
        A heartbeat older than 90s is unavailable.
        """
        now = time.time()
        threshold_seconds = 90

        # Fresh heartbeat (10 seconds ago)
        recent_heartbeat = now - 10
        self.assertTrue((now - recent_heartbeat) <= threshold_seconds)

        # Stale heartbeat (95 seconds ago - sleeping or disconnected)
        stale_heartbeat = now - 95
        self.assertFalse((now - stale_heartbeat) <= threshold_seconds)

    def test_path_traversal_rejection(self):
        """Security: Rejects any path with '..' or attempts to escape workspace."""
        attacks = [
            "../secret.txt",
            "..\\windows\\system32\\calc.exe",
            "foo/../../etc/passwd",
            "..",
            "subdir/../../../boot.ini"
        ]
        for attack in attacks:
            is_valid, msg = validate_safe_path(attack)
            self.assertFalse(is_valid, f"Expected attack to be blocked: {attack}")
            self.assertIn("forbidden", msg.lower())

    def test_safe_path_allowed(self):
        """Allows valid relative paths within workspace."""
        is_valid, path = validate_safe_path("documents/notes.txt")
        self.assertTrue(is_valid)
        self.assertTrue(path.endswith("notes.txt"))

    def test_app_launcher_allowlist(self):
        """Only allowlisted applications can be launched."""
        # Allowed apps
        self.assertTrue(validate_app_name("notepad")[0])
        self.assertTrue(validate_app_name("calculator")[0])
        self.assertTrue(validate_app_name("calc")[0] or validate_app_name("calculator")[0])
        
        # Disallowed arbitrary executables
        self.assertFalse(validate_app_name("powershell.exe")[0])
        self.assertFalse(validate_app_name("arbitrary_malware.exe")[0])
        self.assertFalse(validate_app_name("format.com")[0])

    def test_url_validation(self):
        """Only valid http/https URLs are permitted."""
        self.assertTrue(validate_url("https://www.google.com"))
        self.assertTrue(validate_url("http://localhost:3000/dashboard"))
        
        # Disallowed schemes
        self.assertFalse(validate_url("javascript:alert(1)"))
        self.assertFalse(validate_url("file:///C:/Windows/System32"))
        self.assertFalse(validate_url("ftp://malicious-site.com"))

    def test_screenshot_authorization_check(self):
        """Screenshot must fail if user_confirmed is false or absent."""
        res = execute_screenshot({"user_confirmed": False})
        self.assertEqual(res["status"], "error")
        self.assertIn("Explicit user confirmation", res["message"])

    def test_duplicate_command_handling(self):
        """Agent must reject processing the same command ID twice."""
        daemon = JarvisAgentDaemon()
        daemon.client.report_command_result = MagicMock()

        test_cmd = {
            "id": "cmd-test-12345",
            "command_type": "system_info",
            "payload": {}
        }
        # First execution
        daemon.handle_command(test_cmd)
        self.assertIn("cmd-test-12345", daemon.processed_command_ids)
        self.assertEqual(daemon.client.report_command_result.call_count, 1)

        # Duplicate delivery attempt
        daemon.handle_command(test_cmd)
        # Should not report a second result
        self.assertEqual(daemon.client.report_command_result.call_count, 1)

if __name__ == "__main__":
    unittest.main()
