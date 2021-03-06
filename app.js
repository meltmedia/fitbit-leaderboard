var express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    moment = require('moment'),
    uuid = require('uuid-v4'),
    basicAuth = require('basic-auth'),
    logger = require('./modules/logger'),
    users = require('./routes/users'),
    config = require('./modules/config'),
    db = require('./modules/mongo'),
    fitbit = require('./modules/fitbit'),
    path = require('path'),
    passport = require('passport'),
    FitbitStrategy = require( 'passport-fitbit-oauth2' ).FitbitOAuth2Strategy,
    app = express(),
    env = app.get('env');

// Config
app.use('/leaderboard', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use('/api/public/users', users);
app.use(cookieParser());
app.use(session({
  secret: uuid(),
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

db.connect();

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Set up Fitbit OAuth
passport.use(new FitbitStrategy({
    clientID: config.fitbit.clientID,
    clientSecret: config.fitbit.clientSecret,
    callbackURL: 'http://' + config.host + '/auth/fitbit/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      var secret = {
        token: accessToken,
        refreshToken: refreshToken
      };

      fitbit.addUser(secret, profile);

      return done(null, profile);
    });
  }
));

var auth = function (req, res, next) {
  var credentials = basicAuth(req);

  if (!config.restricted || (credentials && credentials.pass === config.restricted.pass && credentials.name === config.restricted.name)) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Authentication required"');
    res.sendStatus(401);
  }
};

app.get('/auth/fitbit', auth, passport.authenticate('fitbit', { scope: ['activity','heartrate','location','profile'] }));

app.get('/auth/fitbit/callback', passport.authenticate(
  'fitbit',
  {failureRedirect: '/'}),
  function(req, res) {
    res.redirect('/leaderboard');
  });

// Update all users' steps and distance
var updateData = function () {
  db.find().then(function (users) {
    for (var i = 0; i < users.length; i++) {
      fitbit.updateSteps(users[i]);
      fitbit.updateDistance(users[i]);
    }
  }).catch(function (err) {
    logger.warn('error finding users', err);
  });
};

updateData();

// Update at configured interval
setInterval(updateData, config.updateInterval);

app.use('/', function(req, res) {
  res.redirect('/leaderboard');
});

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  logger.info('request 404\'d: ' + req.url);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (env !== 'production') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
