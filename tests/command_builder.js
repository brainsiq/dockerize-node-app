'use strict';

const expect = require('chai').expect;

const commandBuilder = require('../lib/command_builder');

describe('Command builder', () => {
  const directory = `${__dirname}/sample_app_source_code`;

  describe('docker build', () => {
    let command;

    before(() => {
      command = commandBuilder.dockerBuild(directory);
    });

    it('creates a docker build command', () => {
      expect(command).to.match(/^docker build /);
    });

    it('uses [app-name] as the image name', () => {
      expect(command).to.match(/ -t package-json-name/);
    });

    it('builds from the given directory', () => {
      expect(command).to.match(new RegExp(` ${directory}$`));
    });
  });

  describe('docker run', () => {
    let command;

    before(() => {
      command = commandBuilder.dockerRun(directory);
    });

    it('creates a docker run command', () => {
      expect(command).to.match(/^docker run /);
    });

    it('runs the [app-name] image', () => {
      expect(command).to.match(/ package-json-name$/);
    });

    it('runs a temporary container', () => {
      expect(command).to.match(/ --rm /);
    });
  });
});
