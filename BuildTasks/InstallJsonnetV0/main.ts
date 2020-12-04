/* eslint-disable @typescript-eslint/no-non-null-assertion */

import path from 'path';
import {
  setResult,
  TaskResult,
  getInput,
  getEndpointAuthorizationParameter,
  getVariable,
  error,
  warning,
  debug,
} from 'azure-pipelines-task-lib/task';
import { request } from '@octokit/request';
import type { RequestInterface, Endpoints } from '@octokit/types';
import os from 'os';
import download from 'download';
import decompress from 'decompress';

const defaultRetryLimit = 4;

const repoInfo = Object.freeze({ owner: 'google', repo: 'go-jsonnet' });

// eslint-disable-next-line @typescript-eslint/ban-types
type GitHub = RequestInterface;

type Release = Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response']['data'];

const executeWithRetries = <T>(operationName: string, operation: () => Promise<T>, retryCount: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const attempt = (attemptNo: number) => {
      operation().then(resolve, (error) => {
        warning(`Operation '${operationName}'#${attemptNo + 1} failed: ${error}`);
        if (attemptNo >= retryCount) {
          error(`Operation '${operationName}' failed all retries`);
          reject(error);
          return;
        }

        setTimeout(() => attempt(attemptNo + 1), 4_000);
      });
    };

    attempt(0);
  });

const getLatestRelease = async (github: GitHub): Promise<Release> => {
  const result = await github('GET /repos/{owner}/{repo}/releases/latest', repoInfo);

  if (result.status !== 200) {
    throw new Error(`Operation 'GET /repos/{owner}/{repo}/releases/latest' returned status code ${result.status}`);
  }

  return result.data;
};

const getTaggedRelease = async (tag: string, github: GitHub): Promise<Release> => {
  const result = await github('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
    tag,
    ...repoInfo,
  });

  if (result.status !== 200) {
    throw new Error(`Operation 'GET /repos/{owner}/{repo}/releases/tags/{tag}' returned status code ${result.status}`);
  }

  return result.data;
};

const main = async (): Promise<string | false> => {
  const connection = getInput('connection', true)!;
  const version = getInput('version', false);
  let installationPath = getInput('installationPath', false);
  if (!installationPath) {
    installationPath = path.join(getVariable('Agent.ToolsDirectory')!, 'jsonnet');
  }

  const token = getEndpointAuthorizationParameter(connection, 'AccessToken', false);
  const retryLimit = parseInt(getVariable('VSTS_HTTP_RETRY')!)
    ? parseInt(getVariable('VSTS_HTTP_RETRY')!)
    : defaultRetryLimit;

  const github: GitHub = request.defaults({
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  let release: Release;
  if (version) {
    release = await executeWithRetries('getTaggedRelease', () => getTaggedRelease(version, github), retryLimit);
  } else {
    release = await executeWithRetries('getLatestRelease', () => getLatestRelease(github), retryLimit);
  }

  const isWin = os.type() === 'Windows_NT';
  const asset = release.assets.find((a) => {
    if (!a.name.endsWith('x86_64.tar.gz')) return false;
    if (isWin && !a.name.includes('Windows')) return false;
    if (!isWin && !a.name.includes('Linux')) return false;
    return true;
  });

  if (!asset) {
    release.assets.forEach((a) => debug(`Asset: ${a.name}`));
    error(`No valid tarball asset found in release '${release.name}' ('${release.tag_name}')`);
    return false;
  }

  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, asset.name);
  await download(asset.browser_download_url, tempFile);
  const files = await decompress(tempFile, installationPath);

  for (const file of files) {
    debug(`Extracted ${file.path} to ${installationPath}`);
  }

  return release.name ?? release.tag_name;
};

main().then(
  (release) => {
    if (release) {
      setResult(TaskResult.Succeeded, `Installed Jsonnet version '${release}'`);
    } else {
      setResult(TaskResult.Failed, 'Failed to install Jsonnet version');
    }
  },
  (e) => {
    setResult(TaskResult.Failed, `${e}`);
  },
);
