'use strict';

const os = require('os');
const expect = require('chai').expect;
const nock = require('nock');

const dockerize = require('../lib/dockerize');

describe('Dockerize', () => {
  describe('dockerfile', () => {
    let nvmrcNockScope;
    let packageJsonNockScope;
    let unknownNodeNockScope;

    beforeEach(() => {
      nvmrcNockScope = nock('https://semver.io')
        .get('/node/4.x.x')
        .reply(200, '4.2.1');

      packageJsonNockScope = nock('https://semver.io')
        .get('/node/5.x.x')
        .reply(200, '5.0.0');

      unknownNodeNockScope = nock('https://semver.io')
        .get('/node/stable')
        .reply(200, '5.1.0')
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('throws when there is no package.json', done => {
      return dockerize.dockerfile(__dirname + '/12345')
        .then(() => {
          done(new Error('Expected test to error'));
        })
        .catch(err => {
          expect(err).to.exist;
          expect(err).to.be.a('error');
          expect(err.message).to.equal(`${__dirname}/12345 does not contain a package.json file!`);
          done();
        });
    });

    describe('node version from .nvmrc', () => {
      it('requests node version from semver.io', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_nvmrc')
          .then(() => {
            expect(nvmrcNockScope.isDone()).to.equal(true, 'Version not requested from semver.io!');
          });
      });

      it('sets dockerfile FROM', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_nvmrc')
          .then(dockerfile => {
            const lines = dockerfile.split(os.EOL);
            expect(lines[0]).to.equal('FROM node:4.2.1');
          });
      });
    });

    describe('node version from package.json', () => {
      it('requests node version from semver.io', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_node_engine')
          .then(() => {
            expect(packageJsonNockScope.isDone()).to.equal(true, 'Version not requested from semver.io!');
          });
      });

      it('sets dockerfile FROM', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_node_engine')
          .then(dockerfile => {
            const lines = dockerfile.split(os.EOL);
            expect(lines[0]).to.equal('FROM node:5.0.0');
          });
      });
    });

    describe('unknown node version', () => {
      it('requests stable version from semver.io', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_no_node_version')
          .then(() => {
            expect(unknownNodeNockScope.isDone()).to.equal(true, 'Version not requested from semver.io!');
          });
      });;

      it('sets dockerfile FROM', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_no_node_version')
          .then(dockerfile => {
            const lines = dockerfile.split(os.EOL);
            expect(lines[0]).to.equal('FROM node:5.1.0');
          });
      });
    });

    describe('error getting node version', () => {
      beforeEach(() => {
        // override existing nock response to 500 error
        nock.cleanAll();

        nock('https://semver.io')
          .get('/node/4.x.x')
          .reply(500, 'an error from semver.io');
      });

      it('throws with error information', done => {
        return dockerize.dockerfile(__dirname + '/sample_app_nvmrc')
          .then(() => {
            done(new Error('Expected an error in test'));
          })
          .catch(err => {
            expect(err).to.exist;
            expect(err).to.be.a('error');
            expect(err.message).to.equal('Unable to get node version for base image from https://semver.io. 500 - an error from semver.io');
            done();
          });
      });
    });

    describe('CMD', () => {
      it('is npm start when defined in package.json', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_npm_start')
          .then(dockerfile => {
            const lines = dockerfile.split(os.EOL);
            expect(lines[lines.length - 1]).to.equal('CMD ["npm", "start"]');
          });
      });

      it('is node [entrypoint] when defined in package.json', () => {
        return dockerize.dockerfile(__dirname + '/sample_app_node_entrypoint')
          .then(dockerfile => {
            const lines = dockerfile.split(os.EOL);
            expect(lines[lines.length - 1]).to.equal('CMD ["node", "entrypoint.js"]');
          });
      });

      it('throws when unknown', done => {
        return dockerize.dockerfile(__dirname + '/sample_app_unknown_cmd')
          .then(dockerfile => {
            done(new Error('Expected an error in test'));
          })
          .catch(err => {
            expect(err).to.exist;
            expect(err).to.be.a('error');
            expect(err.message).to.equal('Cannot determine CMD for Dockerfile. Set "start" script or "main" attribute in package.json!');
            done();
          });
      });
    });
  });
});
