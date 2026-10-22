"""
Heartbeat module for Jarvis Laptop Agent.
Collects lightweight health metrics and operating system status to report to the cloud backend.
Zero-dependency first: uses Windows native APIs with fallback to psutil if installed.
"""
import time
import platform
import os
import ctypes
from typing import Dict, Any
from src.config import AGENT_VERSION, DEVICE_ID

def get_system_memory_info() -> Dict[str, float]:
    """Retrieves RAM usage using Windows native GlobalMemoryStatusEx or psutil fallback."""
    try:
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
            total_gb = stat.ullTotalPhys / (1024 ** 3)
            avail_gb = stat.ullAvailPhys / (1024 ** 3)
            return {
                "total_gb": round(total_gb, 2),
                "avail_gb": round(avail_gb, 2),
                "used_pct": float(stat.dwMemoryLoad)
            }
    except Exception:
        pass

    # Fallback if psutil is available
    try:
        import psutil
        ram = psutil.virtual_memory()
        return {
            "total_gb": round(ram.total / (1024 ** 3), 2),
            "avail_gb": round(ram.available / (1024 ** 3), 2),
            "used_pct": ram.percent
        }
    except Exception:
        return {"total_gb": 0.0, "avail_gb": 0.0, "used_pct": 0.0}

def get_system_battery_info() -> Dict[str, Any]:
    """Retrieves battery status using Windows native GetSystemPowerStatus or psutil fallback."""
    try:
        class SYSTEM_POWER_STATUS(ctypes.Structure):
            _fields_ = [
                ("ACLineStatus", ctypes.c_byte),
                ("BatteryFlag", ctypes.c_byte),
                ("BatteryLifePercent", ctypes.c_byte),
                ("SystemStatusFlag", ctypes.c_byte),
                ("BatteryLifeTime", ctypes.c_ulong),
                ("BatteryFullLifeTime", ctypes.c_ulong),
            ]

        power_status = SYSTEM_POWER_STATUS()
        if ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(power_status)):
            pct = power_status.BatteryLifePercent
            ac = power_status.ACLineStatus == 1
            if pct <= 100:
                return {
                    "percent": pct,
                    "power_plugged": ac,
                    "status": "charging" if ac else "discharging"
                }
    except Exception:
        pass

    try:
        import psutil
        b = psutil.sensors_battery()
        if b:
            return {
                "percent": b.percent,
                "power_plugged": b.power_plugged,
                "status": "plugged" if b.power_plugged else "battery"
            }
    except Exception:
        pass

    return {"status": "desktop_or_unavailable"}

def collect_heartbeat_payload() -> Dict[str, Any]:
    """
    Collects minimal, non-sensitive hardware and agent status.
    Keeps telemetry minimal and respects user privacy.
    """
    mem = get_system_memory_info()
    battery = get_system_battery_info()
    ram_pct = mem.get("used_pct", 0.0)

    os_summary = {
        "platform": platform.system(),
        "release": platform.release(),
        "cpu_cores": os.cpu_count() or 1,
        "ram_usage_pct": ram_pct,
        "ram_avail_gb": mem.get("avail_gb", 0.0),
        "battery": battery
    }

    # Determine health state
    health = "healthy"
    if ram_pct > 95.0:
        health = "degraded"

    return {
        "device_id": DEVICE_ID,
        "agent_version": AGENT_VERSION,
        "client_timestamp": time.time(),
        "health_status": health,
        "os_info": os_summary
    }
