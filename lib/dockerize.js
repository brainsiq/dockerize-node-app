'use strict';

const fs = require('fs');
const _ = require('lodash-deep');
const request = require('request-promise');

module.exports.dockerfile = dir => {
  let semVer;

  if (fs.existsSync(`${dir}/.nvmrc`)) {
    semVer = fs.readFileSync(`${dir}/.nvmrc`, 'utf8');
  }
  else if (fs.existsSync(`${dir}/package.json`)) {
    const packageJson = require(`${dir}/package.json`);

    semVer = _.deepGet(packageJson, 'engines.node');

    if (!semVer) {
      semVer = 'stable';
    }
  }

  return request(`https://semver.io/node/${semVer}`)
    .then(version => {
      return `FROM node:${version}`
    })
    .catch(response => {
      throw new Error(`Unable to get node version for base image from https://semver.io. ${response.message}`)
    });
};
