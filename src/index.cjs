#!/usr/bin/env node
const { program } = require("commander");
const { name, description, version } = require("../package.json");

/** Run the commander program */
program
  // Parse package.json
  .name(name)
  .description(description)
  .version(version, "-v, - version")
  // Parse arguments
  .parse(process.argv);
