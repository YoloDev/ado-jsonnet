/* eslint-disable */

const SemanticReleaseError = require('@semantic-release/error');

module.exports = async (logger, env) => {
  // TODO: signin
  // TODO: Check that we have a vss-extension.json
  logger.log('Verify authentication for tfx');
  const { TFX_TOKEN } = env;
  if (!TFX_TOKEN) {
    throw new SemanticReleaseError('No tfx personal access token specified. (set env "TFX_TOKEN")', 'ENOTFXPAT');
  }
};
