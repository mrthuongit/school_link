/* global angular, document, window */
'use strict';

angular.module('starter.controllers')
.controller('ContactCtrl', function($scope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, SchoolService, localStorageService, $state,
 MultipleViewsManager, $SchoolClass, $resUser) {
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.isExpanded = false;
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);
    $scope.$parent.showMenuRightButton();
    $scope.$parent.showTabs();

    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    $scope.userInfo = localStorageService.get("user");
    $scope.groups = [];
    $scope.teachers = [];
    $scope.parents = [];
    $scope.suppers = [];
    $scope.group = 'teachers';
    $scope.currentClass = {};
    $scope.listChildren = {};


    $scope.callTel = function(tel) {
      console.log('callTel');
      window.location.href = 'tel:'+ tel;
      // $event.stopPropagation();
    }

    $scope.changeGroup = function (val){
      $scope.group = val;
    }

    $scope.toggleGroup = function(group) {
      if($scope.group == 'teachers'){
        angular.forEach($scope.teachers, function(value, key) {
          if (value.id == group) {
            value.show = !value.show;
          }
        });
      }
      else if($scope.group === 'parents') {
        angular.forEach($scope.parents, function(value, key) {
          if (value.id == group) {
            value.show = !value.show;
          }
        });
      } else{
        angular.forEach($scope.suppers, function(value, key) {
          if (value.id == group) {
            value.show = !value.show;
          }
        });
      }
    };

    $scope.isGroupShown = function(group) {
      var ret;
      if($scope.group == 'teachers'){
        angular.forEach($scope.teachers, function(value, key) {
          if (value.id === group) {
            ret = value.show;
          }
        });
      }
      else if($scope.group === 'parents') {
        angular.forEach($scope.parents, function(value, key) {
          if (value.id === group) {
            ret = value.show;
          }
        });
      } else{
        angular.forEach($scope.suppers, function(value, key) {
          if (value.id === group) {
            ret = value.show;
          }
        });
      }
      return ret;
    };
    var children = localStorageService.get("children");
    var listParentLocal;
    var _init = function(){
      var class_id = localStorageService.get("class");
      $SchoolClass.getClassById({id: class_id}, function(result){
        $scope.currentClass = result.records[0];
        $SchoolClass.getListTeacherByIds({ids: $scope.currentClass.teacher_ids}, function(listTeacher){
          $scope.teachers = listTeacher;
        }, function(error){$Error.callbackError(error);});
        $SchoolClass.getListParentByIds({parent_ids: $scope.currentClass.parent_ids}, function(listParent){
          $scope.parents = listParent;
          $scope.suppers = _.filter($scope.parents, function(parent) {
            return parent.category_id.length > 0;
          });
          var children_ids = [];
          $scope.parents.forEach(function(parent){
            children_ids = children_ids.concat(parent.children);
          });
          $resUser.getStudentById({student_ids: children_ids}, function(listChildren){
            listChildren.forEach(function(child){
              $scope.listChildren[child.id] = child;
            })
          }, function(error){
            $Error.callbackError(error);
          })
        }, function(error){
          $Error.callbackError(error);
        });
      }, function(error){
        $Error.callbackError(error);
      });
    }
    _init();

    /*SchoolService.getContacts({userInfo:$scope.userInfo, student_id: children.id}).then(function(result){
      console.log('getContacts return ', result);
      if(result.status){
        $scope.teachers = result.teacherResults;
        $scope.parents = result.parentResults;
        $scope.suppers = _.filter($scope.parents, function(parent) {
          return parent.category_id.length > 0;
        });
      }
    });*/

    var _getScheduleBySemester = function(){
      SchoolService.getTKB({userInfo:$scope.userInfo}).then(function(result){
        if(result.status){
          $scope.tkb = result.tkbbd;
          $scope.groupTeacher = _.groupBy($scope.tkb, function(day){
            return day.teacher_id[0];
          });
          Object.keys($scope.groupTeacher).forEach(function(key){
            $scope.groupTeacher[key] = _.uniq($scope.groupTeacher[key], function(tkb){
              return tkb.subject_id[0];
            })
          })
        }
      })
    };
    _getScheduleBySemester();

    $scope.createChannel = function(user){
      if(user.user_id || user.parent_user_id){
        $scope.listChannel = localStorageService.get("listChannelInit");
        if(user.parent_user_id){
          user.user_id = user.parent_user_id;
        }
        if(user){
          var listChannelTwoUser = _.filter($scope.listChannel, function(channel){
            return channel[1].users.length == 2
          });
          var existuser;
          var existChannel;
          listChannelTwoUser = JSON.parse(JSON.stringify(listChannelTwoUser));
          listChannelTwoUser = _.forEach(listChannelTwoUser, function(channel){
            var tmpUsers = _.reject(channel[1].users, function(tmp){
              return tmp.id === $scope.userInfo.uid;
            });
            channel.user = tmpUsers[0];
          })
          var existChannel = _.find(listChannelTwoUser, function(tmp){
            return tmp.user.id === user.user_id[0];
          })
          
          if(!existChannel){
            localStorageService.set("user_add_channel", user);
            MultipleViewsManager.updateView("add_new_channel");
            $state.go("app.message");
          } else{
            localStorageService.set("chooseChannel", existChannel);
            $state.go("app.channel");
          }
        }
        
       
      }
      console.log(user);
    };

    $scope.callPhoneNumber = function(user){
      if(user.work_phone){
        window.open('tel:' + user.work_phone, '_system')
      } else{
        window.open('tel:' + user.mobile, '_system')
      }
    };
    $scope.sendEmail = function(user){
      if(user.work_email){
        window.open('mailto:' + user.work_email);
      } else{
        window.open('mailto:' + user.email);
      }
    };
})
