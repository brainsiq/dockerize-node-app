'use strict';

const childProcess = require('child_process');
const fs = require('fs');

const commandBuilder = require('./command_builder');
const dockerize = require('./dockerize');

module.exports.run = directory => {
  const dockerfileLocation = `${directory}/Dockerfile`;

  return dockerize.dockerfile(directory)
    .then(dockerfile => new Promise((resolve, reject) => {
      fs.writeFile(dockerfileLocation, dockerfile, err => {
        if (err) {
          reject(err);
        }

        console.log(`Created ${dockerfileLocation}`);
        console.log(dockerfile);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      const command = commandBuilder.dockerBuild(directory);

      console.log(`Building docker image with command: ${command}`);

      const buildProc = childProcess.exec(command, {cwd: directory});

      return buildProc.on('exit', () => {
        resolve();
      });
    }))
    .catch(err => {
      console.error(`Unable to create ${dockerfileLocation}`);
      console.error(err);
    });
};
