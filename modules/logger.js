var winston = require('winston'),
    env = require('express')().get('env'),
    config = require('./config');

require('winston-loggly');

var logger = new (winston.Logger)({
  exitOnError: false,
  transports: [new (winston.transports.Console)()]
});

if (config.loggly) {
  var options = {
    json: true,
    subdomain: config.loggly.subDomain,
    tags: ['NodeJS', 'fitbit-leaderboard', env]
  };

  if (config.loggly.inputName) {
    options.inputName = config.loggly.inputName;
    options.auth = {
      username: config.loggly.username,
      password: config.loggly.password
    };
  } else {
    options.inputToken = config.loggly.inputToken;
  }

  logger.add(winston.transports.Loggly, options);
}

module.exports = logger;
