const fs = require("fs");
const { exec } = require("child_process");

try {
  const data = fs.readFileSync("googleTakeout.json", "utf8");
  const metadata = JSON.parse(data);

  // Pass the extracted metadata to ExifTool
  const exifToolProcess = exec(
    `exiftool -json=${JSON.stringify(metadata)} /path/to/your/photograph.jpg`,
    (error, stdout) => {
      if (error) {
        console.error("Error executing ExifTool:", error);
        return;
      }
      console.log("Metadata added to photograph:", stdout);
    },
  );

  exifToolProcess.on("error", (err) => {
    console.error("Error executing ExifTool:", err.message);
  });
} catch (err) {
  console.error("Error reading file:", err);
}
