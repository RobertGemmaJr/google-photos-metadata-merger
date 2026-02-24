# Archive Diff (Bun)

Compare two archives by filename and report differences. Designed for read-only scans of large photo archives.

## Requirements

- Bun installed

## Usage

```bash
bun run index.ts --icloud "/path/to/icloud" --mobile "/path/to/mobile"
```

### Options

```text
--output <path>         Output base folder (default: reports)
--mode <mode>           filename | filename+meta | filename+hash
--ignore <patterns>     Comma-separated glob patterns to ignore
--include-ext <exts>    Comma-separated extensions to include (ex: .jpg,.png)
--case-sensitive        Match filenames with case sensitivity
--follow-symlinks       Follow symlinks while scanning
--concurrency <n>       Number of concurrent comparisons
--help                  Show help
```

### Examples

```bash
bun run index.ts --icloud "/mnt/nas/icloud" --mobile "/mnt/nas/mobile" --mode filename+meta
```

```bash
bun run index.ts --icloud "/mnt/nas/icloud" --mobile "/mnt/nas/mobile" --mode filename+hash --include-ext ".jpg,.png"
```

## Output

Each run creates a timestamped folder under `reports/`:

- `only-in-icloud.csv`
- `only-in-mobile.csv`
- `same-name-different.csv`
- `summary.log`
- `run.log`

## Environment Variables

- `ICLOUD_ARCHIVE`
- `MOBILE_ARCHIVE`
- `OUTPUT_DIR`
- `IGNORE_PATTERNS`
- `INCLUDE_EXT`
- `CASE_SENSITIVE` ("true"/"false")
- `FOLLOW_SYMLINKS` ("true"/"false")
- `COMPARISON_MODE` (filename | filename+meta | filename+hash)
- `CONCURRENCY`

```

```
