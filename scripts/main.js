(function (angular) {
  'use strict';
  google.maps.visualRefresh = true;

  angular.module('App', ['ngRoute', 'ui.bootstrap', 'ngProgress', 'google-maps', 'ngAnimate'])

  .directive('googleStreetView', function () {
    return {
      replace: true,
      restrict: 'E',
      scope: '=',
      template: '<div></div>',
      link: function (scope, elm, attr) {
        google.maps.event.addDomListener(window, 'load', function () {
          scope.streetView = new google.maps.StreetViewPanorama(elm[0], {
            position: new google.maps.LatLng(53.5333, -113.5000),
            pov: {
              heading: 34,
              pitch: 10
            }
          });
        });
      }
    }
  })

  .factory('BylawInfractions', ['$http', '$q', function ($http, $q) {
    return {
      get: function () {
        var deferred = $q.defer();

        $http.get('http://data.edmonton.ca/resource/xgwu-c37w.json')
        .success(function (data) {
          deferred.resolve(data);
        })
       .error(function () {
          deferred.reject('failed to connect');
        })

        return deferred.promise;
      }
    }
  }])

  .controller('MainCtrl', ['$scope', 'BylawInfractions', function ($scope, BylawInfractions) {
    function setInfractionType () {
      BylawInfractions.get().then(function (infractions) {
        var infractionTypes = {};

        infractions = infractions
        .filter(function (infraction) {
          infractionTypes[infraction.complaint] = null;
          return infraction.complaint == $scope.selectedType && infraction.location;
        })
        .map(function (infraction) {
          var marker = infraction.location

          delete marker.needs_recoding;
          marker.icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

          marker.onclick = function () {
            $scope.markers.map(function (marker) {
              marker.icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
            });

            marker.icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

            $scope.$apply(function () { $scope.viewMap = false });
            $scope.streetView.setPosition(new google.maps.LatLng(marker.latitude, marker.longitude))
            setTimeout(function () { google.maps.event.trigger($scope.streetView, 'resize') }, 50);
          }

          return marker;
        })

        $scope.markers = infractions;
        $scope.infractionTypes = Object.keys(infractionTypes);
      });
    }

    $scope.viewMap = true;
    $scope.markers = [];

    $scope.map = {
      control: {},
      center: {
        latitude: 53.5333,
        longitude: -113.5000,
        draggable: 'true'
      },
      zoom: 11,
      options: {
        streetViewControl: false,
        panControl: false
      }
    }

    $scope.infractionTypes = [];
    $scope.selectedType = 'Graffiti';
    $scope.viewMap = true;

    $scope.setSelected = function (type) {
      if ($scope.selectedType !== type) {
        $scope.selectedType = type;
        $scope.viewMap = true;
        setInfractionType();
      }
    }

    $scope.backToMain = function () {
      $scope.viewMap = true;
      setTimeout(function () {
        $scope.map.control.refresh();
      }, 50);
    }

    setInfractionType();
  }])
}(angular));
