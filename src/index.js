#!/usr/bin/env node

import { program } from "commander";
import { name, description, version } from "../package.json";

program
  // Parse package.json
  .name(name)
  .description(description)
  .version(version, "-v, - version")
  // Parse arguments
  .parse(process.argv);
