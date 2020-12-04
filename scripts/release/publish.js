/* eslint-disable */

const execa = require('execa');

module.exports = async (packageVsix, logger, env) => {
  const { TFX_TOKEN } = env;

  if (packageVsix) {
    logger.log('Publishing .vsix');
    await execa(
      'tfx',
      [
        'extension',
        'publish',
        '--json',
        '--vsix',
        packageVsix,
        '--token',
        TFX_TOKEN,
        '--service-url',
        'https://marketplace.visualstudio.com',
      ],
      {
        stdio: 'inherit',
      },
    );
  }
};
