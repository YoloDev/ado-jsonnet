/* eslint-disable */

let prepared;

const execa = require("execa");
const { updateVersion } = require("./set-task-version");

const verifyConditions = async (pluginConfig, context) => {
  const { options, env } = context;

  if (options.publish) {
    if (!env.TFX_TOKEN) throw new Error(`No TFX_TOKEN set`);
    if (!env.TFX_URL) throw new Error(`No TFX_URL set`);
    await execa("tfx", ["login", "-t", env.TFX_TOKEN, "u", env.TFX_URL], {
      stderr: "inherit",
      stdout: "inherit",
    });
  }
};

const prepare = async (pluginConfig, context) => {
  await updateVersion(context.nextRelease.version);
  prepared = true;
};

const publish = async (pluginConfig, context) => {
  if (!prepared) {
    await prepare(pluginConfig, context);
  }

  context.logger.log("publishing to marketplace (in theory)");
};

module.exports = { prepare, verifyConditions };
