'use strict';

const fs = require('fs');

const dockerize = require('./dockerize');

module.exports.run = directory => {
  const dockerfileLocation = `${directory}/Dockerfile`;

  return dockerize.dockerfile(directory)
    .then(dockerfile => new Promise((resolve, reject) => {
      fs.writeFile(dockerfileLocation, dockerfile, err => {
        if (err) {
          console.error(`Unable to write dockerfile to ${dockerfileLocation}.`);
          reject(err);
        }

        console.log(`Created ${dockerfileLocation}`);
        console.log(dockerfile);
        resolve();
      });
    }))
    .catch(err => {
      console.error(`Unable to create ${dockerfileLocation}`);
      console.error(err);
    });
};
