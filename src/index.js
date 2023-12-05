#!/usr/bin/env node
import { Command } from "commander";

// TODO: Can't seem to import from package.json?
// import { name, description, version } from "../package.json";
import findCommand from "./commands/find.js";

const PROGRAM = new Command();

// Add metadata from package.json
// TODO: Can't seem to import from package.json?
// PROGRAM.name(name).description(description).version(version, "-v, -version");
PROGRAM.name("google-photos-metadata-merger")
  .description(
    "Merges the metadata files from Google Photos' takeout download with the original files",
  )
  .version("0.0.1", "-v, - version");

// Add program level arguments
PROGRAM.argument("<inDir>", "Input directory")
  .argument("[outDir]", "Output directory", "out")
  .argument("[errorDir]", "Output directory for media with errors", "error");

// TODO: Add option for "--dry-run"
// TODO: add option for "-d, --debug"
// TODO: Add option for "--inDir"
// TODO: Add option for "--outDir"
// TODO: Add option for "--errorDir"

// TODO: Add action for when no subcommand is given
PROGRAM.action((inDir, outDir, errorDir) => {
  console.log(inDir, outDir, errorDir);
});

PROGRAM.addCommand(findCommand);

// TODO: Add "find" command
// TODO: Add "merge" command
// TODO: Add "organize" command

// Parse CLI arguments
PROGRAM.parse();
