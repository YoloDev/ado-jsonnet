/* eslint-disable */

const path = require("path");
const fs = require("fs");
const jsonfile = require("jsonfile");
const semver = require("semver");

async function* getBuildTaskDirs() {
  const entries = await fs.promises.readdir(
    path.resolve(__dirname, "..", "BuildTasks")
  );

  for (const entry of entries) {
    if (["common", "typings"].includes(entry.toLowerCase())) continue;
    const fullPath = path.resolve(buildTasksDir, entry);
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isDirectory()) continue;
    yield fullPath;
  }
}

const updateVersion = async (newVersion, logger) => {
  const parsed = semver.parse(newVersion);
  const versionString = `${parsed.minor}.${parsed.minor}.${parsed.patch}`;

  logger.log("Setting vss-extension version to: %s", versionString);

  const extensionFile = path.resolve(__dirname, "..", "vss-extension.json");
  const extension = await jsonfile.readFile(extensionFile);
  extension.version = versionString;
  await jsonfile.writeFile(extensionFile, extension, { spaces: 2, EOL: "\n" });

  const newVersionParts = Object.freeze({
    Major: parsed.major,
    Minor: parsed.minor,
    Patch: parsed.patch,
  });

  logger.log("Setting all task versions to: %O", newVersion);
  for await (const dir of getBuildTaskDirs()) {
    const taskJsonFiles = [
      path.resolve(dir, "task.json"),
      path.resolve(dir, "task.loc.json"),
    ];

    for (const taskJsonFile of taskJsonFiles) {
      const task = await jsonfile.readFile(taskJsonFile);

      task.version = newVersionParts;

      await jsonfile.writeFile(taskJsonFile, task, { spaces: 2, EOL: "\n" });
    }
  }
};

module.exports = { updateVersion };
