'use strict';

const fs = require('fs');
const dockerize = require('./lib/dockerize');

const directory = process.cwd();
const dockerfileLocation = `${directory}/Dockerfile`

dockerize.dockerfile(process.cwd())
  .then(dockerfile => {
    fs.writeFile(dockerfileLocation, dockerfile, err => {
      if (err) {
        console.error(`Unable to write dockerfile to ${dockerfileLocation}.`);
        return console.error(err);
      }

      console.log('Created Dockerfile');
    });
  });
