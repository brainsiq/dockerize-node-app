'use strict';

const fs = require('fs');
const https = require('https');
const os = require('os');
const _ = require('lodash-deep');

const getNodeSemVer = (dir, packageJson) => {
  let semVer;

  if (fs.existsSync(`${dir}/.nvmrc`)) {
    semVer = fs.readFileSync(`${dir}/.nvmrc`, 'utf8');
  }

  return semVer || _.deepGet(packageJson, 'engines.node') || 'stable';
};

const getSpecificNodeVersion = semVer =>
  new Promise((resolve, reject) => {
    https.get(`https://semver.io/node/${semVer}`, res => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          return resolve(data);
        }

        reject(new Error(`HTTP ${res.statusCode} response - ${data}`));
      });
    }).on('error', err => reject(err));
  });

const getCmd = packageJson => {
  if (_.deepGet(packageJson, 'scripts.start')) {
    return '["npm", "start"]';
  }

  const entrypoint = packageJson.main;

  if (entrypoint) {
    return `["node", "${entrypoint}"]`;
  }
};

module.exports.dockerfile = dir => {
  if (!fs.existsSync(`${dir}/package.json`)) {
    return Promise.reject(new Error(`${dir} does not contain a package.json file!`));
  }

  const packageJson = require(`${dir}/package.json`);

  const semVer = getNodeSemVer(dir, packageJson);
  const runCmd = getCmd(packageJson);

  if (!runCmd) {
    return Promise.reject(new Error('Cannot determine CMD for Dockerfile. Set "start" script or "main" attribute in package.json!'));
  }

  return getSpecificNodeVersion(semVer)
    .then(version =>
      `FROM node:${version}${os.EOL}` +
      `COPY . /usr/local/${packageJson.name}${os.EOL}` +
      `WORKDIR /usr/local/${packageJson.name}${os.EOL}` +
      `RUN npm install${os.EOL}` +
      `CMD ${runCmd}`)
    .catch(err => {
      throw new Error(`Unable to get node version for base image from https://semver.io. ${err.message}`);
    });
};
