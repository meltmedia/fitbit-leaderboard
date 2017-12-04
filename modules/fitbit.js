var request = require('request'),
    krypt = require('krypt'),
    logger = require('./logger'),
    db = require('./mongo'),
    config = require('./config'),
    JWT = require('jwt-simple'),
    _ = require('lodash');

var ERR_NO_DATA = 'no data returned for steps from fitbit api';
var ERR_INVALID_REQUEST = 'Unable to get activities for user';
var ERR_BAD_REQUEST = 'error making request to fitbit api';

module.exports = {
  deauthorize: function(user, callback) {
    db.update({
      encodedId: user.encodedId,
      authorized: false
    })
    .then(function() {
      return callback(null, true);
    }).catch(function (err) {
      logger.warn('error updating user credentials', err);
      return callback(err);
    });
  },

  getCredentials: function(user, callback) {
    var self = this;
    var credentials = JSON.parse(krypt.decrypt(JSON.parse(user.credentials), config.secret));

    if (credentials.token !== undefined && credentials.token !== null) {
      var decodedToken = JWT.decode(credentials.token, null, true);

      // Check if the token is still good
      if (Date.now() / 1000 < decodedToken.exp) {
        return callback(null, credentials);
      }
    }

    if (!_.isString(credentials.refreshToken) && !_.isString(credentials.tokenSecret)) {
      logger.debug('Deauthorizing ' + user.fullName + ', missing refresh: ' + Object.keys(credentials));

      self.deauthorize(user, function(err) {
        if (err) {
          return callback(err, null);
        }

        return callback('deauthorized for missing refresh token', null);
      });
    }
    else {
      // Get a new token if expired
      request.post({
        url: 'https://api.fitbit.com/oauth2/token',
        headers: {
          Authorization: 'Basic ' + new Buffer(config.fitbit.clientID + ':' + config.fitbit.clientSecret).toString('base64')
        },
        form: {
          'grant_type': 'refresh_token',
          'refresh_token': credentials.refreshToken || credentials.tokenSecret,
        },
        json: true
      }, function(err, response, payload) {
        if (err) {
          logger.warn('error getting new access token', err);
          return callback(err, null);
        }

        if (payload.errors && payload.errors.length > 0) {
          self.deauthorize(user, function() {
            return callback('Error refreshing access token for "'+ user.fullName +'": ' + payload.errors[0].message, null);
          })
        }

        credentials = {
          token: payload.access_token,
          refreshToken: payload.refresh_token
        };

        db.update({
          encodedId: user.encodedId,
          authorized: true,
          credentials: JSON.stringify(krypt.encrypt(JSON.stringify(credentials), config.secret))
        }).catch(function (err) {
          logger.warn('error updating user credentials', err);
        });

        return callback(null, credentials);
      });
    }
  },

  addUser: function(secret, profile) {
    var self = this;
    var userProfile = profile._json.user;

    var encodedCredentials = JSON.stringify(krypt.encrypt(JSON.stringify(secret), config.secret));

    var userObj = {
      credentials: JSON.stringify(encodedCredentials),
      authorized: true,
      avatar: userProfile.avatar,
      encodedId: userProfile.encodedId,
      fullName: userProfile.fullName,
      lastUpdated: new Date()
    };

    db.find(userObj.encodedId).then(function (user) {
      if (user) {
        db.update(userObj).then(function () {
          self.updateAll(userObj.encodedId);
        }).catch(function (err) {
          logger.warn('error updating user', err);
        });
      } else {
        db.add(userObj).then(function () {
          self.updateAll(userObj.encodedId);
        }).catch(function (err) {
          logger.warn('error adding new user', err);
        });
      }
    });
  },

  updateAll: function (encodedId) {
    var self = this;

    db.find(encodedId).then(function (user) {
      self.updateSteps(user);
      self.updateDistance(user);
    }).catch(function (err) {
      logger.warn('error finding user', err);
    });
  },

  getData: function (path, user, callback) {
    this.getCredentials(user, function(credentialsError, credentials) {
      if (credentialsError !== null) {
        return callback({message: credentialsError}, null);
      }

      if (credentials === null || credentials === undefined || credentials.token === undefined || credentials.token === null) {
        return callback({message: 'user ' + user.fullName + ' is missing credentials'}, null);
      }

      // See Activity Time Series for details https://dev.fitbit.com/docs/activity/#activity-time-series
      // GET /1/user/[user-id]/[resource-path]/date/[base-date]/[end-date].json
      request.get({
        url: 'https://api.fitbit.com/1/user/-/' + path + '/date/' +
              config.startDate + '/' + config.endDate + '.json',
        headers: {
          Authorization: 'Bearer ' + credentials.token
        },
        json: true
      }, function(err, response, data) {
        if (err) {
          logger.warn(ERR_BAD_REQUEST, err);
          return callback({status: response.statusCode, message: ERR_BAD_REQUEST}, null);
        }

        if (response.statusCode !== 200) {
          logger.warn(ERR_INVALID_REQUEST, response.body);
          return callback({status: response.statusCode, message: ERR_INVALID_REQUEST}, null);
        }

        if (typeof data !== 'object') {
          logger.warn(ERR_NO_DATA);
          return callback({status: response.statusCode, message: ERR_NO_DATA}, null);
        }

        return callback(null, data);
      });
    });
  },

  updateSteps: function(user) {
    var self = this;

    self.getData('activities/steps', user, function(err, data) {
      if (err) {
        logger.warn('Unable to update steps', err);
        return;
      }

      var steps = _
        .chain(data['activities-steps'])
        .map(function(item) {
          return parseInt(item.value);
        })
        .sum()
        .value();

      db.update({
        encodedId: user.encodedId,
        steps: steps,
        authorized: true,
        lastUpdated: new Date()
      }).catch(function (err) {
        logger.warn('error updating user', err);
      });
    });
  },

  updateDistance: function (user) {
    var self = this;

    self.getData('activities/distance', user, function(err, data) {
      if (err) {
        logger.warn('Unable to update steps', err);
        return;
      }

      var distance = _
        .chain(data['activities-distance'])
        .map(function(item) {
          return parseFloat(item.value);
        })
        .sum()
        .value();

      db.update({
        encodedId: user.encodedId,
        distance: distance,
        authorized: true,
        lastUpdated: new Date()
      }).catch(function (err) {
        logger.warn('error updating user', err);
      });
    });
  }
};
