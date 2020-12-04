/* eslint-disable */

const verifyTfx = require("./verify");
const prepareTfx = require("./prepare");

let verified = false;
let prepared = false;

const verifyConditions = async (pluginConfig, { logger, env }) => {
  await verifyTfx(logger, env);
  verified = true;
};

const prepare = async (
  pluginConfig,
  { nextRelease: { version }, logger, env }
) => {
  if (!verified) {
    await verifyTfx(logger, env);
    verified = true;
  }

  await prepareTfx(version, pluginConfig.packageVsix, logger);
  prepared = true;
};

module.exports = { verifyConditions, prepare };
