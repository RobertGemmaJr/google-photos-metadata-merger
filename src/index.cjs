#!/usr/bin/env node
const { Command } = require("commander");

const { name, description, version } = require("../package.json");

const PROGRAM = new Command();

// Add metadata from package.json
PROGRAM.name(name).description(description).version(version, "-v, - version");

// TODO: Add action for when no subcommand is given

// TODO: Add option for "--dry-run"
// TODO: Add option for "--inDir"
// TODO: Add option for "--outDir"
// TODO: Add option for "--errorDir"

// TODO: Add "find" command
// TODO: Add "merge" command
// TODO: Add "organize" command

// Parse arguments
PROGRAM.parse(process.argv);
