/* eslint-disable */

let prepared;

const execa = require("execa");
const vsce = require("vsce");
const { updateVersion } = require("./set-task-version");

const verifyConditions = async (pluginConfig, context) => {
  const { env } = context;

  if (!env.TFX_TOKEN) throw new Error(`No TFX_TOKEN set`);
  if (!env.TFX_URL) throw new Error(`No TFX_URL set`);
  // await execa("tfx", ["login", "-t", env.TFX_TOKEN, "u", env.TFX_URL], {
  //   stderr: "inherit",
  //   stdout: "inherit",
  // });
};

const prepare = async (pluginConfig, context) => {
  await updateVersion(context.nextRelease.version);
  await execa(
    "tfx",
    [
      "extension",
      "create",
      "--json",
      "--output-path",
      "yolodev-jsonnet-build-tasks.vsix",
    ],
    {
      stderr: "inherit",
      stdout: "inherit",
    }
  );
  prepared = true;
};

const publish = async (pluginConfig, context) => {
  const { env } = context;

  if (!prepared) {
    await prepare(pluginConfig, context);
  }

  await vsce.publishVSIX("yolodev-jsonnet-build-tasks.vsix", {
    pat: env.TFX_TOKEN,
  });
  // await execa(
  //   "tfx",
  //   [
  //     "extension",
  //     "publish",
  //     "--json",
  //     "--vsix",
  //     "yolodev-jsonnet-build-tasks.vsix",
  //   ],
  //   {
  //     stderr: "inherit",
  //     stdout: "inherit",
  //   }
  // );
};

module.exports = { prepare, verifyConditions, publish };
