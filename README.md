# google-photos-metadata-merger

Merges the metadata files from Google Photos' takeout download with the original files

## ExifTool Commands

### Probably needed

- `-r` Recursively process directories
- `-fileOrder DateTimeOriginal` sorts processes the files in order of the DateTimeOriginal tag
- `-j` parses the tags in json format
  - I think it expects the JSON file itself?
- `-echo` Echo text to stdout
- `-echo3 "${status}"` Echos the text after processing with the exit status
- `--ext JSON` Process all supported file types _except_ JSON files
- `-overwrite_original_in_place` Overwrite the original file with the new tags and preserves the origianl file attributes

### Helpers

- `@ ARGFILE` Reads command-line arguments from the file ARGFILE
- `-delete_original` Deletes the "\_original" file after copying tags
- `efile[NUM][!] ERRFILE` Save names of files with errors
- `fileNUM ALTFILE` Load tags from alternate file
- `-progress` Show progress information
- `-h` outputs as HTML

### Useful examples

- `'-Directory<DateTimeOriginal' -d %Y/%m [DIR]` moves all files in `DIR` into a hierarchy based on year, and month

## Notes

- exiftool can read the JSON files, is it possible to extract the tags from there and use them to automatically parse into the original files?
-
