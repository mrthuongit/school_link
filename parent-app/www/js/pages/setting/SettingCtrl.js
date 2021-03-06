/* global angular, document, window */
'use strict';

angular.module('starter.controllers')
.controller('SettingCtrl', function($scope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, $state, SchoolService, localStorageService, 
  $pouchDb, $resUser, toaster, $translate, MultipleViewsManager) {
  $scope.$parent.showHeader();
  $scope.$parent.clearFabs();
  $scope.isExpanded = false;
  $scope.$parent.setExpanded(false);
  $scope.$parent.setHeaderFab(false);
  $scope.$parent.showMenuRightButton();
  $scope.$parent.hideTabs();
  var userInfo = localStorageService.get("user");
  
  if(localStorageService.get("setting")){
    $scope.setting = localStorageService.get("setting");
  } else{
    $scope.setting = {
      isVibration: true,
      isSound: true,
      isNotification: true
    };
  }
  $scope.user = localStorageService.get("user");
  $scope.partner = localStorageService.get("partner_user");
  // Activate ink for controller
  ionicMaterialInk.displayEffect(); 
  $scope.group = "setting";
  $scope.changeGroup = function(group) {
      $scope.group = group;
    };

  $scope.changeNotification= function(){
    if(!$scope.setting.isNotification){
      $scope.setting.isVibration = false;
      $scope.setting.isSound = false;
    }
    $scope.saveUserSetting();
  };

  $scope.saveUserSetting = function(){
    if(!$scope.setting.isVibration){
      window.plugins.OneSignal.enableVibrate(false);
    } else{
      window.plugins.OneSignal.enableVibrate(true);
    }
    if(!$scope.setting.isSound){
      window.plugins.OneSignal.enableSound(false);
    } else{
      window.plugins.OneSignal.enableSound(true);
    }
    if(!$scope.setting.isNotification){
      window.plugins.OneSignal.deleteTag("user_id");
    } else{
      window.plugins.OneSignal.sendTag("user_id", userInfo.uid);
    }
    _updateChildrenForUser();
  };

  var _updateChildrenForUser = function(children){
    $pouchDb.getDocById("res.user", userInfo.username).then(function(userLc){
      userLc.data.setting = $scope.setting;
      localStorageService.set("setting", userLc.data.setting);
      $pouchDb.updateDoc("res.user", userLc).then(function(result){
      });
    });
  };

   $scope.changePassword = function(){
    if(_validate()){
      var info = {
        old_passwd: $scope.user.old_passwd,
        new_passwd: $scope.user.new_passwd
      }
      $resUser.changePassword(info, function(success){
        toaster.pop('success', "", $translate.instant('change_password_success'));
        $scope.user.login = false;
        localStorageService.set("user", $scope.user);
        _updateUserLc();
        $state.go("app.login");
      }, function(error){
        toaster.pop('error', "", $translate.instant('change_password_error'));
        $Error.callbackError(error);
      });
    }
  };
  var _updateUserLc = function(){
    $pouchDb.getDocById("res.user", $scope.user.username).then(function(userLc){
      userLc.data.login = false;
      $pouchDb.updateDoc("res.user", userLc).then(function(result){
      });
    });
  }

  var _validate = function(){
    var flag = true;
    if($scope.user.password !== $scope.user.old_passwd){
      toaster.pop('error', "", $translate.instant('old_password_error'));
      flag = false;
    }
    if($scope.user.new_passwd !== $scope.user.confirm_new_passwd){
      toaster.pop('error', "", $translate.instant('error_same_password'));
      flag = false;
    }
    return flag;
  };

  $scope.updatePartner = function(){
    $resUser.updatePartner($scope.partner, function(success){
      localStorageService.set("partner_user", $scope.partner);
      MultipleViewsManager.updateView("getInfoForUser");
      toaster.pop('success', "", $translate.instant('update_user_success'));
    }, function(error){});
  }

    
})
