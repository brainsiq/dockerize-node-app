#!/usr/bin/env node

'use strict';

const fs = require('fs');
const exec = require('child_process').exec;

const dockerize = require('./lib/dockerize');
const commandBuilder = require('./lib/command_builder');

const directory = process.cwd();
const dockerfileLocation = `${directory}/Dockerfile`;

const executeCommand = (command, directory, errorMessage) =>
  new Promise((resolve, reject) => {
    const proc = exec(command, {cwd: directory});

    proc.stdout.pipe(process.stdout);

    proc.stderr.pipe(process.stderr);

    proc.on('exit', code => {
      if (code === 0) {
        return resolve();
      }

      const error = new Error(errorMessage);
      error.exitCode = code;

      reject(error);
    });
  });

dockerize.dockerfile(directory)
  .then(dockerfile => new Promise((resolve, reject) => {
    fs.writeFile(dockerfileLocation, dockerfile, err => {
      if (err) {
        console.error(`Unable to write dockerfile to ${dockerfileLocation}.`);
        reject(err);
      }

      console.log('Created Dockerfile');
      resolve();
    });
  }))
  .then(() => {
    const command = commandBuilder.dockerBuild(directory);

    console.log(`Building docker image with command: ${command}`);

    return executeCommand(command, directory, 'docker build command failed');
  })
  .then(() => {
    console.log('Built docker image');

    const command = commandBuilder.dockerRun(directory);

    console.log(`Running docker image with command: ${command}`);

    return executeCommand(command, directory, 'docker run command failed');
  })
  .then(() => console.log('Exited container'))
  .catch(err => {
    console.error(err);

    if (err.exitCode) {
      console.log(`Exit code: ${err.exitCode}`);
    }
  });
