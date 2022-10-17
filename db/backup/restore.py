import os
import subprocess
import argparse
from utils import prepare_env_dict, parse_backup_dir


def find_last_backup_dir(backup_dir: str | None):
    used_backup_dir = parse_backup_dir(backup_dir)
    if not os.path.exists(used_backup_dir):
        return None

    years = os.listdir(used_backup_dir)
    years.sort(reverse=True)
    if len(years) == 0:
        return None

    months = os.listdir(f"{used_backup_dir}/{years[0]}")
    months.sort(reverse=True)
    if len(months) == 0:
        return None

    days = os.listdir(f"{used_backup_dir}/{years[0]}/{months[0]}")
    days.sort(reverse=True)
    if len(days) == 0:
        return None

    return f"{used_backup_dir}/{years[0]}/{months[0]}/{days[0]}/"


def find_last_backup_file(backup_dir: str | None):
    last_backup_dir = find_last_backup_dir(backup_dir)
    if last_backup_dir is None:
        return None

    files = os.listdir(last_backup_dir)
    files.sort(reverse=True)
    if len(files) == 0:
        return None

    return files[0]


def find_backup_dir_by_file(file_path: str, backup_dir: str | None):
    used_backup_dir = parse_backup_dir(backup_dir)
    if not os.path.exists(used_backup_dir):
        return None

    splits = file_path.split("_")
    if len(splits) < 3:
        return None

    year = splits[0]
    month = splits[1]
    day = splits[2]

    split_day = day.split("T")
    if len(split_day) > 1:
        day = split_day[0]

    return f"{used_backup_dir}/{year}/{month}/{day}"


def get_backup_file(backup_dir: str | None, file_path: str | None) -> str | None:
    if file_path is not None:
        return file_path
    backup_file = find_last_backup_file(backup_dir)
    return backup_file


def get_backup_dir(backup_dir: str | None, file_path: str | None) -> str | None:
    if file_path is not None:
        return find_backup_dir_by_file(file_path, backup_dir)
    return find_last_backup_dir(backup_dir)


def update_env_variables(env_dict: dict, args_backup_dir: str | None, file_path: str | None, container_name: str | None):
    backup_file = get_backup_file(args_backup_dir, file_path)
    backup_dir = get_backup_dir(args_backup_dir, file_path)

    if backup_file is None:
        print("Cannot find backup file")
        return None

    if backup_dir is None:
        print("Cannot find backup directory")
        return None

    env_dict["BACKUP_FILE"] = backup_file
    env_dict["BACKUP_DIR"] = backup_dir
    if container_name is not None:
        env_dict["CONTAINER_NAME"] = container_name

    return env_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser("restore db state")
    parser.add_argument("--last", default=False, action="store_true", help="use last generated backup file")
    parser.add_argument("-f", dest="file_path", type=str, help="use specified backup file")
    parser.add_argument("--password", type=str, help="datebase password")
    parser.add_argument("--host", type=str, help="datebase address")
    parser.add_argument("--user", type=str, help="datebase user")
    parser.add_argument("--container", type=str, help="docker container name inside which database is located")
    parser.add_argument("--dir", type=str, help="backup directory")
    args = parser.parse_args()

    if args.last == False and args.file_path is None:
        print("No backup file specified [either argument --last or -f should be specified]")
        exit(1)
    if args.last == True and args.file_path is not None:
        print("Either option --last or -f should be specified at the same time")
        exit(1)

    env_dict = update_env_variables(prepare_env_dict(args.password, args.host, args.user, args.dir), args.dir, args.file_path, args.container)
    if env_dict is None:
        exit(1)

    result = subprocess.run(["../stop-db.sh"], env=env_dict, capture_output=True)
    if result.returncode != 0:
        print("Error occured while running script 'stop-db.sh'")
        print(result.stdout)
        exit(1)
    result = subprocess.run(["../start-db.sh"], env=env_dict, capture_output=True)
    if result.returncode != 0:
        print("Error occured while running script 'start-db.sh'")
        print(result.stdout)
        exit(1)

    result = subprocess.run(["./restore-db.sh"], env=env_dict)
    if result.returncode != 0:
        print("Database restore process failed")
        exit(1)

    print(f"""Database restored from backup '{env_dict["BACKUP_DIR"]}{env_dict["BACKUP_FILE"]}'""")

