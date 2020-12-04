/* eslint-disable */

const setTaskVersion = require("./set-task-version");

module.exports = async (version, packageVsix, logger) => {
  await setTaskVersion(version, logger);

  if (packageVsix) {
    logger.log("Packaging version %s as .vsix", version);
    await execa(
      "tfx",
      ["extension", "create", "--json", "--output-path", packageVsix],
      {
        stdio: "inherit",
      }
    );
  }
};
