# dockerize-node-app

[![Circle CI](https://circleci.com/gh/brainsiq/dockerize-node-app/tree/master.svg?style=svg&circle-token=a639b747f151247d6b8f99bda7b49dc4c337210d)](https://circleci.com/gh/brainsiq/dockerize-node-app/tree/master)

CLI tool to generate a Dockerfile for running a NodeJS application, and starting a Docker container from it.

*This project was a bit of fun to learn a bit more about combining Docker and Node.js. The features documented below should work but no more features will be added.*

# Installation

`npm install -g dockerize-app`

# Usage

```
# creates dockerfile, builds image and runs container
cd /path/to/node/app
dockerize
```

### Dockerfile generation

* Sets node:x.x.x as the base image, where x.x.x is the latest version (using https://semver.io), which satisifies:
 * .nvmrc file
 * OR engines.node property from package.json
* Adds source code into docker image
* Runs `npm install`
* Sets start command as npm start or node [entrypoint.js] depending on package.json settings
