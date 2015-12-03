var request = require('request'),
    krypt = require('krypt'),
    refresh = require('passport-oauth2-refresh'),
    logger = require('./logger'),
    db = require('./mongo'),
    config = require('./config');

module.exports = {
  addUser: function (credentials, profile) {
    var self = this;
    var userProfile = profile._json.user;

    var userObj = {
      credentials: JSON.stringify(credentials),
      authorized: true,
      avatar: userProfile.avatar,
      encodedId: userProfile.encodedId,
      fullName: userProfile.fullName,
      refreshAttempted: false
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

  refresh: function (user) {
    var self = this;
    var credentials = JSON.parse(krypt.decrypt(JSON.parse(user.credentials), config.secret));

    refresh.requestNewAccessToken('fitbit', credentials.refreshToken, function (err, accessToken, refreshToken) {
      if (err) {
        db.update({
          encodedId: user.encodedId,
          refreshAttempted: true
        });
      } else {
        var secret = {
          accessToken: accessToken,
          refreshToken: refreshToken
        };

        var newCredentials = krypt.encrypt(JSON.stringify(secret), config.secret);
        self.addUser(newCredentials, user);
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

  updateSteps: function (user) {
    var credentials = JSON.parse(krypt.decrypt(JSON.parse(user.credentials), config.secret));
    var url = 'https://api.fitbit.com/1/user/-/activities/tracker/steps/date/' + config.startDate + '/' + config.endDate + '.json';
    var self = this;

    request.get({
      url: url,
      auth: {bearer: credentials.accessToken},
      json: true
    }, function (err, resp, json) {
      if (err) {
        logger.warn('error getting steps from fitbit api', err);
        return;
      }

      if (typeof json !== 'object') {
        logger.info('no data returned for steps from fitbit api');
        return;
      }

      if (json.errors) {
        if (!user.refreshAttempted) {
          self.refresh(user);
        } else {
          db.update({
            encodedId: user.encodedId,
            authorized: false
          }).catch(function (err) {
            logger.warn('error updating user', err);
          });
        }

        return;
      }

      var data = json['activities-tracker-steps'],
          steps = 0;

      if (!data) {
        logger.info('no steps returned in data from fitbit api');
        return;
      }

      for (var i = 0; i < data.length; i ++) {
        steps += parseInt(data[i].value);
      }

      db.update({
        encodedId: user.encodedId,
        steps: steps,
        authorized: true
      }).catch(function (err) {
        logger.warn('error updating user', err);
      });
    });
  },

  updateDistance: function (user) {
    var credentials = JSON.parse(krypt.decrypt(JSON.parse(user.credentials), config.secret));
    var url = 'https://api.fitbit.com/1/user/-/activities/tracker/distance/date/' + config.startDate + '/' + config.endDate + '.json';
    var self = this;

    request.get({
      url: url,
      headers: {
        'Accept-Language': 'en_US'
      },
      auth: {bearer: credentials.accessToken},
      json: true
    }, function (err, resp, json) {
      if (err) {
        logger.warn('error getting activities from fitbit api', err);
        return;
      }

      if (typeof json !== 'object') {
        logger.info('no data returned for activities from fitbit api');
        return;
      }

      if (json.errors) {
        if (!user.refreshAttempted) {
          self.refresh(user);
        } else {
          db.update({
            encodedId: user.encodedId,
            authorized: false
          }).catch(function (err) {
            logger.warn('error updating user', err);
          });
        }

        return;
      }

      var data = json['activities-tracker-distance'],
          distance = 0;

      if (!data) {
        logger.info('no activities returned in data from fitbit api');
        return;
      }

      for (var i = 0; i < data.length; i ++) {
        distance += parseFloat(data[i].value);
      }

      db.update({
        encodedId: user.encodedId,
        distance: distance,
        authorized: true
      }).catch(function (err) {
        logger.warn('error updating user', err);
      });
    });
  }
};
