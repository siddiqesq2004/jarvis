"""
System information command handler.
Returns memory, disk, and battery diagnostics using Windows native APIs.
Zero external package dependencies required.
"""
import os
import shutil
import platform
from typing import Dict, Any
from src.heartbeat import get_system_memory_info, get_system_battery_info

def execute_system_info(payload: Dict[str, Any]) -> Dict[str, Any]:
    ram = get_system_memory_info()
    battery = get_system_battery_info()
    
    # Disk usage using standard library shutil
    try:
        disk = shutil.disk_usage("/")
        disk_total_gb = round(disk.total / (1024 ** 3), 2)
        disk_free_gb = round(disk.free / (1024 ** 3), 2)
    except Exception:
        disk_total_gb = 0.0
        disk_free_gb = 0.0

    return {
        "status": "success",
        "data": {
            "os": f"{platform.system()} {platform.release()} ({platform.architecture()[0]})",
            "hostname": platform.node(),
            "cpu_cores": os.cpu_count() or 1,
            "ram_total_gb": ram.get("total_gb", 0.0),
            "ram_available_gb": ram.get("avail_gb", 0.0),
            "ram_used_pct": ram.get("used_pct", 0.0),
            "disk_total_gb": disk_total_gb,
            "disk_free_gb": disk_free_gb,
            "battery": battery
        }
    }
