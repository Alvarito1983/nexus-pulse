const Dockerode = require('dockerode');

let opts;
if (process.env.DOCKER_HOST) {
  const url = new URL(process.env.DOCKER_HOST.replace('tcp://', 'http://'));
  opts = { host: url.hostname, port: parseInt(url.port) || 2375, protocol: 'http' };
} else {
  opts = { socketPath: '/var/run/docker.sock' };
}

module.exports = new Dockerode(opts);
