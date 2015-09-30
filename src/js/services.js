angular.module('FitbitLeaderboard.services', [])

.service('quoteService', ['$http', '$q', function ($http, $q) {
  var cache;

  this.get = function () {
    var deferred = $q.defer();

    if (!cache) {
      $http.get('/leaderboard/quotes.json')
      .success(function (data) {
        cache = data;
        deferred.resolve(data);
      })
      .error(function (data) {
        deferred.reject(data);
      });
    } else {
      deferred.resolve(cache);
    }

    return deferred.promise;
  };
}])

.service('usersService', ['$http', '$q', function ($http, $q) {
  this.get = function () {
    var deferred = $q.defer();

    $http.get('/api/public/users')
    .success(function (data) {
      deferred.resolve(data);
    })
    .error(function (data) {
      deferred.reject(data);
    });

    return deferred.promise;
  };
}]);
