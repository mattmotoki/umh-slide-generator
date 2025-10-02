"""
Infrastructure layer for file operations
"""
import os
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional

from app.core import config


def load_json_file(file_path: Path) -> Optional[Dict[str, Any]]:
    """Load JSON file and return parsed content"""
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(file_path: Path, data: Dict[str, Any]) -> None:
    """Save data to JSON file"""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_temp_file(suffix: str = '', prefix: str = 'tmp_') -> str:
    """Create a temporary file and return its path"""
    with tempfile.NamedTemporaryFile(suffix=suffix, prefix=prefix, delete=False) as tmp_file:
        return tmp_file.name


def cleanup_temp_file(file_path: str) -> None:
    """Remove temporary file if it exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass  # Ignore cleanup errors


def ensure_directory(directory: Path) -> None:
    """Ensure directory exists"""
    directory.mkdir(parents=True, exist_ok=True)


def get_data_file_path(relative_path: str) -> Path:
    """Get full path for a data file"""
    return config.DATA_DIR / relative_path


def get_static_file_path(relative_path: str) -> Path:
    """Get full path for a static file"""
    return config.STATIC_DIR / relative_path