import json
import subprocess
import os
import typer
from pathlib import Path
from typing_extensions import Annotated


def apply_metadata(json_file, image_file):
    with open(json_file, "r") as f:
        metadata = json.load(f)

    # Build the ExifTool command
    exiftool_cmd = ["exiftool"]

    for key, value in metadata.items():
        exiftool_cmd.append(f"-{key}={value}")

    exiftool_cmd.append(image_file)

    # Run the ExifTool command
    subprocess.run(exiftool_cmd)


def process_directory(directory):
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".json"):
                json_file = os.path.join(root, filename)
                image_file = os.path.join(
                    root, os.path.splitext(filename)[0] + ".jpg"
                )

                # Check if the corresponding image file exists
                if os.path.exists(image_file):
                    apply_metadata(json_file, image_file)


def main(
    directory: Annotated[
        str,
        typer.Argument(help="Input folder containing the images and metadata"),
    ]
):
    print(f"Hello {directory}")
    # if len(sys.argv) != 2:
    #     print("Usage: python script.py /path/to/directory")
    #     sys.exit(1)

    # directory = sys.argv[1]

    # # Validate if the specified directory exists
    # if not os.path.exists(directory):
    #     print(f"Error: Directory '{directory}' not found.")
    #     sys.exit(1)

    # process_directory(directory)


if __name__ == "__main__":
    typer.run(main)
