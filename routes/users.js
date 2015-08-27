var
  express = require('express'),
  router = express.Router(),
  db = require('../modules/mongo');

// GET all users
router.get('/', function (req, res) {
  db.find().then(function (users) {
    res.json(users);
  }).catch(function (err) {
    console.log('error finding users from route', err);
  });
});

module.exports = router;
