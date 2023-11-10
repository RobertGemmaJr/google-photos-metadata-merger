import json
import os
import subprocess
import warnings
from pathlib import Path

import typer
from typing_extensions import Annotated


def is_media_file(filename):
    supported_extensions = {".jpg", ".jpeg", ".png", ".heic", ".mp4", ".mov"}
    _, extension = os.path.splitext(filename)
    return extension.lower() in supported_extensions


def apply_metadata(json_file, media_file):
    with open(json_file, "r") as f:
        metadata = json.load(f)

    # Build the ExifTool command
    exiftool_cmd = ["exiftool"]

    # TODO: Which metadata is actually needed?
    # title
    # description
    # imageViews
    # creationTime
    # photoTakenTime
    # photoLastModifiedTime

    # Location Data
    # ? googlePhotosOrigin
    for key, value in metadata.items():
        exiftool_cmd.append(f"-{key}={value}")

    exiftool_cmd.append(media_file)

    # Run the ExifTool command
    print(exiftool_cmd)
    subprocess.run(exiftool_cmd)
    print()


def main(
    directory: Annotated[
        Path,
        typer.Argument(
            exists=True,
            file_okay=False,
            dir_okay=True,
            writable=True,
            readable=True,
            resolve_path=True,
            help="Input folder containing the images and metadata",
        ),
    ]
):
    # Process the given directory
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.lower().endswith(".json"):
                # Process a
                json_file = os.path.join(root, filename)

                # Find supported media files with the same base name
                media_files = [
                    os.path.join(root, f)
                    for f in os.listdir(root)
                    if f.startswith(os.path.splitext(filename)[0])
                    and is_media_file(f)
                ]

                if len(media_files) > 1:
                    raise Exception(
                        f"Multiple media files found for {json_file}:"
                        + f"\t{media_files}"
                    )

                # Apply metadata for each supported media file
                if media_files:
                    for media_file in media_files:
                        apply_metadata(json_file, media_file)
                else:
                    warnings.warn(
                        f"File {json_file} has no corresponding media files"
                    )


if __name__ == "__main__":
    typer.run(main)
