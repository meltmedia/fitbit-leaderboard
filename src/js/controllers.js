angular.module('FitbitLeaderboard.controllers', ['FitbitLeaderboard.constants'])

.controller('MainCtrl', [function () {
}])

.controller('LeaderboardCtrl', ['$scope', '$interval', 'usersService', 'config', function ($scope, $interval, usersService, config) {
  var ctrl = this;

  ctrl.calculateTotals = function (users) {
    var totalDistance = 0,
        totalSteps = 0;

    for (var i = 0; i < users.length; i++) {
      totalDistance += users[i].distance;
      totalSteps += users[i].steps;
    }

    $scope.totalDistance = totalDistance;
    $scope.totalSteps = totalSteps;
  };

  ctrl.getDaysLeft = function () {
    var now = moment(),
        startMoment = moment(config.startDate),
        endMoment = moment(config.endDate + ' 23:59:59'),
        daysLeft;

    if (now.isBefore(startMoment)) {
      // Multiply by negative one since returned diff is expected to be negative
      daysLeft = startMoment.diff(endMoment, 'days') * -1;
    } else if (now.isAfter(endMoment)) {
      daysLeft = 0;
    } else {
      // Multiply by negative one since returned diff is expected to be negative
      daysLeft = now.diff(endMoment, 'days') * -1;
    }

    if (daysLeft < 0) {
      daysLeft = 0;
    }

    return daysLeft;
  };

  ctrl.getAverageSteps = function (users) {
    console.log(ctrl.getDaysLeft())

    var
      daysLeft = ctrl.getDaysLeft(),
      // When the competition is over, the current date should be the end date.
      currentDate = daysLeft===0 ? moment(config.endDate + ' 23:59:59') : moment(),
      // Add one day to diff. Allows current day to be included in calculation
      days = currentDate.diff(moment(config.startDate), 'days') + 1;

    for (var i = 0; i < users.length; i ++) {
      users[i].averageSteps = users[i].steps / days;
    }
  };

  var update = function () {
    usersService.get().then(function (data) {
      $scope.users = data;
      ctrl.getAverageSteps($scope.users);
      ctrl.calculateTotals(data);
    }).catch(function (error) {
      console.warn(error);
    });
    $scope.daysLeft = ctrl.getDaysLeft();
  };

  update();

  // Update at configured interval
  $interval(update, config.updateInterval);
}])

.controller('RegisterCtrl', ['$scope', '$window', 'config', function ($scope, $window, config) {
  var now = moment(),
      startMoment = moment(config.startDate),
      endMoment = moment(config.endDate);

  $scope.registrationIsOpen = now.isBefore(endMoment);

  $scope.startDate = startMoment.format('MMMM Do');
  $scope.startYear = startMoment.format('YYYY');
  $scope.startDay = startMoment.format('dddd');

  $scope.endDate = endMoment.format('MMMM Do');
  $scope.endYear = endMoment.format('YYYY');
  $scope.endDay = endMoment.format('dddd');

  var month = startMoment.format('M'),
      season = '';

  switch (month) {
    case '12':
    case '1':
    case '2':
      season = 'Winter';
      break;
    case '3':
    case '4':
    case '5':
      season = 'Spring';
      break;
    case '6':
    case '7':
    case '8':
      season = 'Summer';
      break;
    case '9':
    case '10':
    case '11':
      season = 'Fall';
      break;
  }

  $scope.season = season;
}])

.controller('QuoteCtrl', ['$scope', 'quoteService', function ($scope, quoteService) {
  quoteService.get().then(function (data) {
    var quote = data[Math.floor(Math.random() * data.length)];

    $scope.quote = quote.quote;
    $scope.source = quote.source;
  });
}]);
