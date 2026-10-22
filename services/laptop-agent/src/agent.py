"""
Main Laptop Agent Daemon for Jarvis Personal AI Companion.
Runs lightweight background polling and periodic heartbeats.
Executes allowlisted actions only and reports verified results.
"""
import sys
import time
import signal
from typing import Dict, Any

from src.config import HEARTBEAT_INTERVAL, logger, DEVICE_ID, AGENT_VERSION
from src.heartbeat import collect_heartbeat_payload
from src.client import JarvisBackendClient
from src.commands.system_info import execute_system_info
from src.commands.app_launcher import execute_launch_app, execute_open_url
from src.commands.file_ops import execute_list_files, execute_read_file, execute_create_file
from src.commands.clipboard_ops import execute_copy_clipboard
from src.commands.screenshot import execute_screenshot

# Command dispatch mapping
COMMAND_HANDLERS = {
    "system_info": execute_system_info,
    "launch_app": execute_launch_app,
    "open_url": execute_open_url,
    "list_files": execute_list_files,
    "read_file": execute_read_file,
    "create_file": execute_create_file,
    "copy_clipboard": execute_copy_clipboard,
    "screenshot": execute_screenshot
}

class JarvisAgentDaemon:
    def __init__(self):
        self.client = JarvisBackendClient()
        self.is_running = True
        self.last_heartbeat_time = 0
        self.processed_command_ids = set()

    def handle_command(self, cmd: Dict[str, Any]):
        cmd_id = cmd.get("id")
        cmd_type = cmd.get("command_type")
        payload = cmd.get("payload", {})
        
        # Deduplication check
        if cmd_id in self.processed_command_ids:
            logger.warning(f"Rejecting duplicate command execution: {cmd_id}")
            return
            
        logger.info(f"Processing command [{cmd_type}] (ID: {cmd_id})")
        
        handler = COMMAND_HANDLERS.get(cmd_type)
        if not handler:
            logger.error(f"Unrecognized or disallowed command type: {cmd_type}")
            self.client.report_command_result(
                cmd_id,
                status="failed",
                result={},
                error_message=f"Command type '{cmd_type}' is not recognized or allowed."
            )
            self.processed_command_ids.add(cmd_id)
            return

        try:
            result = handler(payload)
            status = "completed" if result.get("status") == "success" else "failed"
            error_msg = result.get("message") if status == "failed" else None
            
            self.client.report_command_result(
                cmd_id,
                status=status,
                result=result,
                error_message=error_msg
            )
        except Exception as e:
            logger.error(f"Exception executing command {cmd_type}: {e}", exc_info=True)
            self.client.report_command_result(
                cmd_id,
                status="failed",
                result={},
                error_message=f"Agent runtime error: {str(e)}"
            )
        finally:
            self.processed_command_ids.add(cmd_id)
            # Cap processed set to prevent memory growth
            if len(self.processed_command_ids) > 500:
                self.processed_command_ids = set(list(self.processed_command_ids)[-250:])

    def run(self):
        logger.info("=" * 60)
        logger.info(f"Jarvis Laptop Agent v{AGENT_VERSION} started.")
        logger.info(f"Device ID: {DEVICE_ID}")
        logger.info(f"Heartbeat Interval: {HEARTBEAT_INTERVAL}s")
        logger.info("Outbound connection active. Zero open inbound ports.")
        logger.info("=" * 60)

        # Setup graceful termination signals
        signal.signal(signal.SIGINT, self._stop)
        signal.signal(signal.SIGTERM, self._stop)

        while self.is_running:
            now = time.time()
            # 1. Send heartbeat if interval elapsed
            if now - self.last_heartbeat_time >= HEARTBEAT_INTERVAL:
                payload = collect_heartbeat_payload()
                resp = self.client.send_heartbeat(payload)
                if resp:
                    logger.debug("Heartbeat acknowledged by server.")
                self.last_heartbeat_time = now

            # 2. Fetch and process pending commands
            commands = self.client.fetch_pending_commands()
            for cmd in commands:
                self.handle_command(cmd)

            # Sleep short duration to conserve CPU (<0.1% CPU)
            time.sleep(2)

        logger.info("Jarvis Laptop Agent stopped gracefully.")

    def _stop(self, signum, frame):
        logger.info("Shutdown signal received. Stopping agent...")
        self.is_running = False

if __name__ == "__main__":
    agent = JarvisAgentDaemon()
    agent.run()
