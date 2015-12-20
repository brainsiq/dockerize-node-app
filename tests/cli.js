'use strict';

const fs = require('fs');
const expect = require('chai').expect;
const sinon = require('sinon');

const cli = require('../lib/cli');
const dockerize = require('../lib/dockerize');

const stubDockerfile = 'FROM node\nCMD ["npm", "start"]';

describe.only('CLI', () => {
  describe('run', () => {
    let sandbox;
    let consoleLogSpy;
    let consoleErrorSpy;

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
    });

    describe('when dockerfile is not generated', () => {
      beforeEach(() => {
        sandbox.stub(dockerize, 'dockerfile', () => Promise.reject(new Error('a dockerfile error')));

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
    });
  });
});
