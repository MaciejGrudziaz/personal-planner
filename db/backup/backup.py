import os
import subprocess
from datetime import datetime
import argparse
from utils import prepare_env_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="make backup")
    parser.add_argument("--password", type=str, help="database password")
    parser.add_argument("--host", type=str, help="database address")
    parser.add_argument("--user", type=str, help="database user")
    parser.add_argument("--dir", type=str, help="directory where backup file will be saved")
    args = parser.parse_args()

    env_dict = prepare_env_dict(args.password, args.host, args.user, args.dir)

    result = subprocess.run(["./run-pgdump.sh"], env=env_dict)
    if result.returncode != 0:
        print("Backup process failed")
        exit(1)

    print(f"""Database dumped to file '{env_dict["BACKUP_DIR"]}/{env_dict["BACKUP_FILE"]}'""")

