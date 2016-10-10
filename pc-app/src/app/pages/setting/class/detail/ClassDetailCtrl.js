/**
 * @author a.demeshko
 * created on 28.12.2015
 */
(function () {
  'use strict';

  angular.module('SchoolLink.pages.setting.class')
    .controller('ClassDetailCtrl', ClassDetailCtrl);

  /** @ngInject */
  function ClassDetailCtrl($scope, $stateParams, localStorageService, $rootScope, $state, $uibModal, toastr, $SchoolClass, $Student, $Schoolarity,
   $SchoolClassGroup, $Parent, $Error) {
    $scope.class = localStorageService.get("chooseClass");
    $scope.class.group_id = $scope.class.group_id[0];
    $scope.class.year_id = $scope.class.year_id[0];
    $scope.listStudent = [];
    var modalInstanceCreateLot;
    var chooseLine;
    $scope.popup1 = {
      opened: false
    };$scope.popup2 = {
      opened: false
    };$scope.popup3 = {
      opened: false
    };$scope.popup4 = {
      opened: false
    };
    var modalListStudent;
    var modalListStudentFileCsv;

    $scope.serialNumber = {};
    var _init = function(){
      if($scope.class.student_ids.length > 0){
        $Student.getListStudentByIds($scope.class, function(result){
          $scope.listStudent =  result;
        }, function(error){
          $Error.callbackError(error);
        });
      };
      $Schoolarity.getAllSchoolarity({}, function(result){
        $scope.listSchoolarity  = result.records;
      }, function(error){$Error.callbackError(error);});
      $SchoolClassGroup.getAllClassGroup({}, function(result){
        $scope.listGroup  = result.records;
      }, function(error){$Error.callbackError(error);});
    };
    $scope.csv = {
      content: null,
      header: true,
      headerVisible: true,
      separator: ',',
      separatorVisible: true,
      result: null,
      encoding: 'UTF-8',
      encodingVisible: true,
    };

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };$scope.open2 = function() {
      $scope.popup2.opened = true;
    };$scope.open3 = function() {
      $scope.popup3.opened = true;
    };$scope.open4 = function() {
      $scope.popup4.opened = true;
    };

    $scope.dateOptions = {
      dateDisabled: false,
      formatYear: 'yy',
      startingDay: 1,
      dateFormat: 'dd-MM-yyyy'
    };

    $scope.keySearch = {};

    _init();

    $scope.updateClass = function(){
      if(_validate()){
        $scope.class.student_ids = [];
        $scope.listStudent.forEach(function(stu){
          $scope.class.student_ids.push(stu.id);
        })
        $SchoolClass.updateClass($scope.class, function(result){
          toastr.success("Cập nhật lớp học thành công", "", {});
          $state.go("setting.class.list");
        }, function(error){$Error.callbackError(error);})
      }
    };

    var _validate = function(){
      var flag = true;
      if(!$scope.class.name || $scope.class.name.length === 0){
        toastr.success($translate.instant('name.require'), "", {});
        flag = false;
      }
      if(!$scope.class.group_id){
        toastr.success($translate.instant('group.require'), "", {});
        flag = false;
      }
      if(!$scope.class.group_id){
        toastr.success($translate.instant('year.require'), "", {});
        flag = false;
      }
       return flag;
    };

    $scope.startSearch = function(){
      $Student.searchStudentByName({value: $scope.keySearch.value}, function(result){
        $scope.listStudentSeach =  result.records;
        if($scope.listStudentSeach.length === 0){
          toastr.warning("Không tìm thấy học sinh nào", "", {});
        } else{
          $scope.listStudentSeach.forEach(function(stu){
            stu.birthday = moment(stu.birthday).format("DD-MM-YYYY");
          });
          if($scope.listStudentSeach.length === 1){
            $scope.addStudent($scope.listStudentSeach[0]);
          } else{
            $scope.openPopupListStudent();
          }
        }
      }, function(error){$Error.callbackError(error);});
    };

    $scope.openPopupListStudent = function () {
      modalListStudent = $uibModal.open({
        animation: true,
        templateUrl: "app/pages/setting/class/widgets/popup.list.student.html",
        scope: $scope
      });
    };
    $scope.openPopupListStudentFileCsv = function () {
      modalListStudentFileCsv = $uibModal.open({
        animation: true,
        size: "lg",
        templateUrl: "app/pages/setting/class/widgets/popup.csv.html",
        scope: $scope
      });
    };

    $scope.addStudent = function(student){
      var existStudent = _.find($scope.listStudent, function(stu){
        return stu.id === student.id;
      });
      if(!existStudent){
        $scope.listStudent.unshift(student);
      }
      if(modalListStudent){
        modalListStudent.dismiss('cancel');
      }
    };

    $scope.removeLine = function(student){
      $scope.listStudent = _.reject($scope.listStudent, function(stu){
        return stu.id === student.id;
      });
    };

    $scope.choosefile = function(){
      console.log($scope.csvFile);    
    };

    var _lastGoodResult = '';
    $scope.chooseFile = function () {
      $scope.openPopupListStudentFileCsv();
    };

     $scope.createListStudent = function(){
      var listParent = [];
      var listStudent = [];
      $scope.csv.result.forEach(function(line){
        if(line.parent_name && line.parent_name.length > 0){
          listParent.push({
            name: line.parent_name || false,
            mobile: line.parent_mobile || false,
            street: line.home_address || false,
            active: true,
            customer: true,
            index: line.index,
            email: false
          });
        }
        listStudent.push({
          index: line.index,
          name: line.name || false,
          last_name: line.last_name || false,
          home_town: line.home_town || false,
          home_address: line.home_address || false,
          birthday: line.birthday.length > 0 ? moment(line.birthday, 'DD-MM-YYYY').format('YYYY-MM-DD'): false,
          student: true/*,
          parent_ids: [[6, false, info.parent_ids]]*/
        });
      });
      $Parent.createListParent({listParent: listParent}, function(resultParent){
        for(var i = 0; i< listParent.length; i++){
          listParent[i].id = resultParent[i];
          var existStudent = _.find(listStudent, function(student){
            return student.index === listParent[i].index;
          });
          if(existStudent){
            existStudent.parent_ids = [[6, false, [listParent[i].id]]];
          }
        };
        $Student.createListStudent({listStudent: listStudent}, function(resultStudent){
          for(var i =0; i< listStudent.length; i++){
            listStudent[i].id = resultStudent[i];
          };
          $scope.listStudent = $scope.listStudent.concat(listStudent);
          modalListStudentFileCsv.dismiss('cancel');
        }, function(error){$Error.callbackError(error);});
      }, function(error){$Error.callbackError(error);});
    }

  }

})();
