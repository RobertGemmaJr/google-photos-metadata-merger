import { Command } from "commander";

export default new Command()
  .name("find")
  .command("find <source> [destination] [error]")
  .description("Find valid metadata fields in the source files")
  .action((source, destination, error) => {
    console.log("find command called");
    console.log(source, destination, error);
  });
