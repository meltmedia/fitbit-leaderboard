var mongoose = require('mongoose'),
    Promise = require('promise'),
    config = require('./config'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
  authorized: Boolean,
  avatar: String,
  credentials: String,
  distance: Number,
  encodedId: String,
  fullName: String,
  refreshAttempted: Boolean,
  steps: Number
});

var User = mongoose.model('User', userSchema);

module.exports = {
  connect: function () {
    var uri = 'mongodb://' + config.mongo.host + '/' + config.mongo.database,
        options = {
          user: config.mongo.user,
          pass: config.mongo.passphrase
        };

    mongoose.connect(uri, options);
  },

  add: function (userObj) {
    return new Promise(function (resolve, reject) {
      var user = new User(userObj);
      user.save(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  find: function (encodedId) {
    return new Promise(function (resolve, reject) {
      if (encodedId) {
        User.findOne({'encodedId': encodedId}).exec(function (err, user) {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
      } else {
        User.find({}).exec(function (err, users) {
          if (err) {
            reject(err);
          } else {
            resolve(users);
          }
        });
      }
    });
  },

  update: function (userObj) {
    return new Promise(function (resolve, reject) {
      User.findOneAndUpdate({'encodedId': userObj.encodedId}, userObj, function (err, user) {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  delete: function (encodedId) {
    return new Promise(function (resolve, reject) {
      User.remove({encodedId: encodedId}, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
