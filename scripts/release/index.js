/* eslint-disable */

const verifyTfx = require('./verify');
const prepareTfx = require('./prepare');
const publishTfx = require('./publish');

let verified = false;
let prepared = false;

const verifyConditions = async (pluginConfig, { logger, env }) => {
  await verifyTfx(logger, env);
  verified = true;
};

const prepare = async (pluginConfig, { nextRelease: { version }, logger, env }) => {
  if (!verified) {
    await verifyTfx(logger, env);
    verified = true;
  }

  await prepareTfx(version, pluginConfig.packageVsix, logger);
  prepared = true;
};

const publish = async (pluginConfig, { nextRelease: { version }, logger, env }) => {
  if (!prepared) {
    await prepareTfx(version, pluginConfig.packageVsix, logger);
    prepared = true;
  }

  await publishTfx(pluginConfig.packageVsix, logger, env);
};

module.exports = { verifyConditions, prepare, publish };
