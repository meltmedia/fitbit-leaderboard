var
  express = require('express'),
  _ = require('lodash'),
  router = express.Router(),
  db = require('../modules/mongo');

// GET all users
router.get('/', function (req, res) {
  db.find().then(function (users) {
    res.json(_.map(users, function (user) {
      return _.pick(user, ['distance', 'steps', 'fullName', 'avatar', 'authorized']);
    }));
  }).catch(function (err) {
    console.log('error finding users from route', err);
  });
});

module.exports = router;
