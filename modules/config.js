var moment = require('moment'),
    env = require('express')().get('env'),
    configJSON;

try {
  configJSON = require('../config.json');
} catch (err) {
  configJSON = {};
}

if (!configJSON.hosts) {
  configJSON.hosts = {};
}

if (!configJSON.dates) {
  configJSON.dates = {};
}

var config = {
  fitbit: {
    key: process.env.FITBIT_API_KEY,
    secret: process.env.FITBIT_API_SECRET
  },
  mongo: {
    user: process.env.FITBIT_MONGO_USER || '',
    passphrase: process.env.FITBIT_MONGO_PASSPHRASE || '',
    host: process.env.FITBIT_MONGO_HOST || 'localhost',
    database: process.env.FITBIT_MONGO_DB || 'fitbit-leaderboard'
  },
  host: env === 'development' ? '127.0.0.1:5455' : process.env.FITBIT_APP_HOST || configJSON.host,
  secret: process.env.FITBIT_CHALLENGE_SECRET,
  startDate: process.env.FITBIT_LEADERBOARD_START || configJSON.dates.startDate || moment().format('YYYY-MM-DD'),
  endDate: process.env.FITBIT_LEADERBOARD_END || configJSON.dates.endDate || moment().add(30, 'days').format('YYYY-MM-DD'),
  updateInterval: process.env.FITBIT_UPDATE_INTERVAL || configJSON.updateInterval || 300000
};

if (process.env.FITBIT_REGISTRATION_PASSPHRASE) {
  config.restricted = {
    pass: process.env.FITBIT_REGISTRATION_PASSPHRASE,
    name: process.env.FITBIT_REGISTRATION_NAME || ''
  };
}

if (process.env.FITBIT_LOGGLY_SUBDOMAIN) {
  config.loggly = {
    subDomain: process.env.FITBIT_LOGGLY_SUBDOMAIN,
    inputName: process.env.FITBIT_LOGGLY_INPUTNAME || '',
    inputToken: process.env.FITBIT_LOGGLY_INPUTTOKEN || '',
    username: process.env.FITBIT_LOGGLY_USERNAME || '',
    password: process.env.FITBIT_LOGGLY_PASSWORD || ''
  };
}

module.exports = config;
