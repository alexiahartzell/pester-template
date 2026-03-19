from pathlib import Path
import yaml

PESTER_DIR = Path.home() / ".pester"
CONFIG_PATH = PESTER_DIR / "config.yaml"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f) or {}


def get_config_value(key: str, default=None):
    config = load_config()
    return config.get(key, default)
