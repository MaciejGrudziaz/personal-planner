import os
from datetime import datetime


def prepare_env_dict(password: str | None, host: str | None, user: str | None, backup_dir: str | None):
    env_dict = dict(os.environ)
    if password is not None:
        env_dict["DB_PASS"] = password
    if host is not None:
        env_dict["DB_HOST"] = host
    if user is not None:
        env_dict["DB_USER"] = user

    env_dict["BACKUP_DIR"] = get_current_backup_directory(backup_dir)
    env_dict["BACKUP_FILE"] = f"{get_backup_prefix()}_backup.sql"

    return env_dict


def get_current_backup_directory(backup_dir: str | None):
    now = datetime.utcnow()
    current_backup_dir = f"{parse_backup_dir(backup_dir)}/{now.year}/{str(now.month).rjust(2, '0')}/{str(now.day).rjust(2, '0')}"
    if os.path.exists(current_backup_dir):
        return current_backup_dir
    os.makedirs(current_backup_dir)
    return current_backup_dir


def parse_backup_dir(backup_dir: str | None):
    return backup_dir if backup_dir is not None else f"{os.getcwd()}/data"


def get_backup_prefix():
    now = datetime.utcnow();
    return now.isoformat(timespec="seconds").replace("-", "_").replace(":", "_")

