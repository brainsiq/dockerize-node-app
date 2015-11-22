'use strict';

const fs = require('fs');
const os = require('os');
const _ = require('lodash-deep');
const request = require('request-promise');

module.exports.dockerfile = dir => {
  if (!fs.existsSync(`${dir}/package.json`)) {
    return Promise.reject(new Error(`${dir} does not contain a package.json file!`));
  }

  const packageJson = require(`${dir}/package.json`);

  let semVer;
  let runCmd;

  if (fs.existsSync(`${dir}/.nvmrc`)) {
    semVer = fs.readFileSync(`${dir}/.nvmrc`, 'utf8');
  }
  else {
    semVer = _.deepGet(packageJson, 'engines.node');

    if (!semVer) {
      semVer = 'stable';
    }
  }

  if (_.deepGet(packageJson, 'scripts.start')) {
    runCmd = '["npm", "start"]';
  }
  else {
    const entrypoint = packageJson.main;

    if (!entrypoint) {
      return Promise.reject(new Error('Cannot determine CMD for Dockerfile. Set "start" script or "main" attribute in package.json!'));
    }

    runCmd = `["node", "${entrypoint}"]`;
  }

  return request(`https://semver.io/node/${semVer}`)
    .then(version => {
      return `FROM node:${version}${os.EOL}`
        + `CMD ${runCmd}`;
    })
    .catch(response => {
      throw new Error(`Unable to get node version for base image from https://semver.io. ${response.message}`)
    });
};
