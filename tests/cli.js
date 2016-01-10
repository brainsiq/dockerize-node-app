'use strict';

const childProcess = require('child_process');
const events = require('events');
const fs = require('fs');
const expect = require('chai').expect;
const sinon = require('sinon');

const cli = require('../lib/cli');
const dockerize = require('../lib/dockerize');
const commandBuilder = require('../lib/command_builder');

const stubDockerfile = 'FROM node\nCMD ["npm", "start"]';
const stubDockerBuildCommand = 'docker build .';

describe.only('CLI', () => {
  describe('run', () => {
    let sandbox;
    let consoleLogSpy;
    let consoleErrorSpy;
    let execStub;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      consoleLogSpy = sandbox.spy(console, 'log');
      consoleErrorSpy = sandbox.spy(console, 'error');
    });

    afterEach(() => sandbox.restore());

    describe('when dockerfile is generated', () => {
      let writeFileStub;

      beforeEach(() => {
        sandbox.stub(dockerize, 'dockerfile', () => Promise.resolve(stubDockerfile));

        writeFileStub = sandbox.stub(fs, 'writeFile', (dir, file, callback) => callback());

        sandbox.stub(commandBuilder, 'dockerBuild', () => stubDockerBuildCommand);

        execStub = sandbox.stub(childProcess, 'exec', () => {
          const proc = new events.EventEmitter();

          setTimeout(() => {
            proc.emit('exit', {});
          }, 50);

          return proc;
        });

        return cli.run('/dir');
      });

      it('saves dockerfile in execution directory', () => {
        expect(writeFileStub.lastCall.args[0]).to.equal('/dir/Dockerfile');
      });

      it('saves the dockerfile contents', () => {
        expect(writeFileStub.lastCall.args[1]).to.equal(stubDockerfile);
      });

      it('prints the dockerfile contents', () => {
        expect(consoleLogSpy.firstCall.args).to.deep.equal(['Created /dir/Dockerfile']);
        expect(consoleLogSpy.secondCall.args).to.deep.equal([stubDockerfile]);
      });

      it('prints the docker biuld command', () => {
        expect(consoleLogSpy.thirdCall.args).to.deep.equal([`Building docker image with command: ${stubDockerBuildCommand}`]);
      });

      it('executes the docker build command', () => {
        expect(execStub.firstCall.args).to.deep.equal([stubDockerBuildCommand, {cwd: '/dir'}]);
      });
    });

    describe('when dockerfile generation fails', () => {
      beforeEach(() => {
        sandbox.stub(dockerize, 'dockerfile', () => Promise.reject(new Error('a dockerfile error')));
        execStub = sandbox.stub(childProcess, 'exec', () => ({}));

        return cli.run('/dir')
          .catch(() => {
            // prevent error breaking tests
          });
      });

      it('prints a dockerfile generation error', () => {
        expect(consoleErrorSpy.firstCall.args).to.deep.equal(['Unable to create /dir/Dockerfile']);
        expect(consoleErrorSpy.secondCall.args[0]).to.be.an('error');
        expect(consoleErrorSpy.secondCall.args[0]).to.have.property('message', 'a dockerfile error');
      });

      it('does not call build command', () => {
        sinon.assert.notCalled(execStub);
      });
    });

    describe('when dockerfile write fails', () => {
      beforeEach(() => {
        sandbox.stub(dockerize, 'dockerfile', () => Promise.resolve(stubDockerfile));
        sandbox.stub(fs, 'writeFile', (dir, file, callback) => callback(new Error('a file write error')));
        execStub = sandbox.stub(childProcess, 'exec', () => ({}));

        return cli.run('/dir')
          .catch(() => {
            // prevent error breaking tests
          });
      });

      it('prints a file write error', () => {
        expect(consoleErrorSpy.firstCall.args).to.deep.equal(['Unable to create /dir/Dockerfile']);
        expect(consoleErrorSpy.secondCall.args[0]).to.be.an('error');
        expect(consoleErrorSpy.secondCall.args[0]).to.have.property('message', 'a file write error');
      });

      it('does not call build command', () => {
        sinon.assert.notCalled(execStub);
      });
    });
  });
});
