/* global angular, document, window */
'use strict';

angular.module('starter.controllers')
.controller('NotificationCtrl', function($scope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, $Imchat, localStorageService, 
  $time, MultipleViewsManager, $resUser, $state, $Error, $ionicSideMenuDelegate, $Notification) {
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.isExpanded = false;
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);
    $scope.$parent.showMenuRightButton();
    $scope.$parent.showTabs();
    $ionicSideMenuDelegate.canDragContent(true);
    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    $scope.user = localStorageService.get("user");
    $scope.listNotification = [];
    var currentDate = moment(new Date()).format("DD/MM/YYYY");
    var prevDate = moment($time.getPrevDate(new Date())).format("DD/MM/YYYY");

    var _init = function(){
      $Notification.getNotification({}, function(result){
        $scope.listNotification = result;
        $scope.listNotification.forEach(function(noti){
          noti.showDate = moment(moment.tz(noti.date, moment.tz.guess())._d).format("hh:mm A DD/MM/YYYY");
          noti.body_short = noti.body.replace(/<\/p>/g,' ').replace(/<(?:.|\n)*?>/gm, '');
          // if(tmp.length > 150){
          //       tmp = tmp.substring(0,tmp.lastIndexOf(" ", 140)) + "...";
          // }
          // noti.body_short=tmp;
        })
      }, function(error){

      })

    };
    _init();
    $scope.gotoDetailNotification = function(notification){
        if(notification.to_read){
            $Notification.readNotification({id: notification.id, default_res_id: notification.res_id}, function(result){
               MultipleViewsManager.updateView("notification");
            }, function(error){

            })
        }
        localStorageService.set("current_notification", notification);
        $state.go("app.detail_notification");
    }

})
