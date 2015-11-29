'use strict';

module.exports.dockerBuild = dir => {
  const packageJson = require(`${dir}/package.json`);

  return `docker build -t ${packageJson.name} ${dir}`;
};

module.exports.dockerRun = dir => {
  const packageJson = require(`${dir}/package.json`);

  return `docker run --rm ${packageJson.name}`;
};
