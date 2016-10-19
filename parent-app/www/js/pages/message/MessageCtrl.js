/* global angular, document, window */
'use strict';

angular.module('starter.controllers')
.controller('MessageCtrl', function($scope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, $Imchat, localStorageService, 
  $time, MultipleViewsManager, $resUser, $state) {
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.isExpanded = false;
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);
    $scope.$parent.showMenuRightButton();
    $scope.$parent.showTabs();
    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    $scope.user = localStorageService.get("user");
    $scope.listChannel = [];
    $scope.listUser = [];
    var chooseChannel = {};
    var dataSendMessage = {};
    $scope.form = {};
    $scope.listMessage = [];
    $scope.historyUser = {};
    $scope.disableForm = true;
    $scope.listChannelLocal = {};
    var listChannelForSearch;
    $scope.listUserForSearch = [];
    $scope.listUserAddNewChannel = [];
    $scope.listChatName = {};
    var currentDate = moment(new Date()).format("DD/MM/YYYY");
    var prevDate = moment($time.getPrevDate(new Date())).format("DD/MM/YYYY");
    $scope.listClass = [];
    var _createNewChannel = function(){
      var user = localStorageService.get("user_add_channel");
      if(user){
        $Imchat.createChannel({user_ids: [$scope.user.uid]}, function(result){
          $Imchat.getSessionById({id: result}, function(session){
            $Imchat.updateState({uuid: session.records[0].uuid}, function(update){
              if(user.parent_user_id){
                $scope.listChatName[user.parent_user_id[0]] = user.name;
                $Imchat.addUserToChannel({uuid: session.records[0].uuid, user_id: user.parent_user_id[0]}, function(addUser){
                  localStorageService.remove("user_add_channel");
                }, function(error){
                  localStorageService.remove("user_add_channel");
                });
              } else{
                $scope.listChatName[user.user_id[0]] = user.name;
                $Imchat.addUserToChannel({uuid: session.records[0].uuid, user_id: user.user_id[0]}, function(addUser){
                  localStorageService.remove("user_add_channel");
                }, function(error){
                  localStorageService.remove("user_add_channel");
                });
              }
              
            }, function(error){});
          }, function(error){});
        }, function(error){});
      }
    };

    MultipleViewsManager.updated('add_new_channel', function (data) {
      _createNewChannel();
    });
    var _init = function(){
      localStorageService.remove("chooseChannel");
      if(localStorageService.get("channels")){
        $scope.listChannelLocal = localStorageService.get("channels");
      } else{
        localStorageService.set("channels", {});
      }
    
      $Imchat.initImchat({}, function(result){
        $scope.listChannel = _.reject(result, function(channel){
          return channel[1].type;
        });
        if($scope.listChannel.length > 0){
         
          var listUserId = [];
          $scope.listChannel.forEach(function(channel){
            channel[1].users.forEach(function(user){
              listUserId.push(user.id);
            });
          });
          listUserId = _.uniq(listUserId);
          listChannelForSearch = JSON.parse(JSON.stringify($scope.listChannel));
          $resUser.getChatNameByUserId({user_ids: listUserId}, function(resultChatName){
            $scope.listChatName = resultChatName;
            localStorageService.set("listChatName", $scope.listChatName);
            //$scope.chooseChannel($scope.listChannel[0]);
          }, function(error){
            
          });
        }
        $timeout(function() {
          ionicMaterialMotion.fadeSlideIn({
              selector: '.animate-fade-slide-in .item'
          });
        }, 200);
      }, function(error){
      })

    };
    _init();

    var _saveChannelLocal = function(listChannel){
      localStorageService.set("channels", listChannel)
    };

    // listen event new message
    MultipleViewsManager.updated('new_message', function (data) {
      var newMessage = localStorageService.get("new_message")[0].message;
      var chooseChannel = localStorageService.get("chooseChannel");
      if(newMessage.type){
        if(newMessage.type === "message"){
          if(!$scope.listChannelLocal[newMessage.to_id[1]]){
            $scope.listChannelLocal[newMessage.to_id[1]] = {};
          }
          $scope.listChannelLocal[newMessage.to_id[1]].last_message = {
            text: newMessage.message,
            date: "Hôm nay "+ moment(newMessage.create_date).format("HH:mm A")
          };
          if(chooseChannel && chooseChannel.length > 0){
            if(chooseChannel[1].uuid !== newMessage.to_id[1]){
              $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi ? $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi++ : $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi = 1;
            } else{
              localStorageService.set("message_channel", localStorageService.get("new_message"))
              MultipleViewsManager.updateView("message_channel");
              $scope.listMessage.push({
                showDate:  "Hôm nay "+ moment(new Date()).format("HH:mm A"),
                from_id: newMessage.from_id,
                message: newMessage.message
              });
            }
          } else{
            $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi ? $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi++ : $scope.listChannelLocal[newMessage.to_id[1]].numberNotifi = 1;
          }
          var existChannel = _.find($scope.listChannel, function(channel){
            return channel[1].uuid === newMessage.to_id[1];
          });
          if(!existChannel){
             $Imchat.updateState({uuid: newMessage.to_id[1]}, function(update){
              _init();
             }, function(error){

             });
          }
          _saveChannelLocal($scope.listChannelLocal);
        } else if(newMessage.type === "meta"){
        } else{
          
        }
      } else{
        if(!newMessage.state){
          _updateStateAndAddToChannel(newMessage.uuid, newMessage.users);
        } else if(newMessage.state ==="open"){
          var existChannel = _.find($scope.listChannel, function(channel){
            return channel[1].uuid === newMessage.uuid;
          });
          if(existChannel){
            existChannel[1].users = newMessage.users;
          } else{
            existChannel = [
              localStorageService.get("new_message")[0].channel,
              {
                state: "open",
                users: newMessage.users,
                uuid: newMessage.uuid
              }
            ]
            $scope.listChannel.push(existChannel);
            listChannelForSearch = JSON.parse(JSON.stringify($scope.listChannel));
          }
          if(existChannel[1].users.length ===2){
            $scope.chooseChannel(existChannel);
          }
          localStorageService.remove("user_add_channel");
        } else if(newMessage.state ==="close"){
          _updateStateAndAddToChannel(newMessage, newMessage.users);
        }
        
      }
      console.log(newMessage);
    });

    var _updateStateAndAddToChannel = function(uuid, users){
      $Imchat.updateState({uuid: uuid}, function(update){
        $scope.listChannel.push([
          localStorageService.get("new_message")[0].channel,
          {
            state: "open",
            users: users,
            uuid: uuid
          }
        ]);
        listChannelForSearch = JSON.parse(JSON.stringify($scope.listChannel));
      }, function(error){});
    }

   /* $scope.chooseChannel = function(channel){
      if(!$scope.listChannelLocal[channel[1].uuid]){
        $scope.listChannelLocal[channel[1].uuid] = {};
      }
      $scope.disableForm = false;
      channel.show = true;
        chooseChannel  = channel;
      $scope.listChannelLocal[channel[1].uuid].numberNotifi = 0;
      $scope.listChannel.forEach(function(chan){
        if(chan[1].uuid !== channel[1].uuid){
          chan.show = false;
        }
      });
      $Imchat.getHistoryByUuid({uuid:channel[1].uuid}, function(history){
        $scope.listMessage = history.reverse();
        $scope.listMessage.forEach(function(message){
          if(moment(message.create_date).format("DD/MM/YYYY") === currentDate){
            message.showDate = "Hôm nay "+ moment(message.create_date).format("HH:mm A");
          } else if(moment(message.create_date).format("DD/MM/YYYY") === prevDate){
            message.showDate = "Hôm qua "+ moment(message.create_date).format("HH:mm A");
          } else{
            message.showDate = moment(message.create_date).format("DD/MM/YYYY HH:mm A");
          }
        });
        if($scope.listMessage.length > 0){
          channel.last_message = {
            text: $scope.listMessage[$scope.listMessage.length -1].message,
            date: $scope.listMessage[$scope.listMessage.length -1].showDate,
          };
          $scope.listChannelLocal[channel[1].uuid].last_message = channel.last_message;
        }
        _saveChannelLocal($scope.listChannelLocal);
      }, function(error){
        $Error.callbackError(error);
      });
    };
*/
    $scope.chooseChannel = function(channel){
      localStorageService.set("chooseChannel", channel);
      $state.go("app.channel");
    }


})