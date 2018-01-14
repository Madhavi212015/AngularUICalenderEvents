var app = angular.module('myapp', ['ui.calendar', 'ui.bootstrap']);
app.controller('CalenderController', ['$scope', '$http', 'uiCalendarConfig', '$uibModal', function ($scope, $http, uiCalendarConfig, $uibModal) {
    $scope.SelectedEvent = null;
    var isFirstTime = true;
    $scope.events = [];
    $scope.eventSources = [$scope.events];

    $scope.NewEvent = {};
    
    //this function for get datetime from json date  
    function getDate(datetime) {
        if (datetime != null) {
            var mili = datetime.replace(/\/Date\((-?\d+)\)\//, '$1');
            return new Date(parseInt(mili));
        }
        else {
            return "";
        }
    }    
    $scope.LoadPersonEvents = function () { 
        
        populate();
    }
    // this function clears clender enents  
    function clearCalendar() {
        if (uiCalendarConfig.calendars.myCalendar != null) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
            uiCalendarConfig.calendars.myCalendar.fullCalendar('unselect');
        }
    }
    //this function reloads calender after Model popupclose
    function ReloadCal(data)
    {
        clearCalendar();
        $scope.events.slice(0, $scope.events.length);
        angular.forEach(data, function (value) {
            $scope.events.push({
                id: value.EventID,
                title: value.Title,
                description: value.Description,
                start: new Date(parseInt(value.StartAt.substr(6))),
                end: new Date(parseInt(value.EndAt.substr(6))),
                allDay: value.IsFullDay,
                stick: true
            });
        });
    }

    //this function Load events from server to display on caledar
    function populate() {
        clearCalendar();
        $http.get('/home/getevents?personid=' + $scope.PersonId.Id, {
            cache: false,
            params: {}
        }).then(function (data) {
            $scope.events.slice(0, $scope.events.length);
            angular.forEach(data.data, function (value) {                   
                $scope.events.push({
                    id: value.EventID,
                    title: value.Title,
                    description: value.Description,
                    start: new Date(parseInt(value.StartAt.substr(6))),
                    end: new Date(parseInt(value.EndAt.substr(6))),
                    allDay: value.IsFullDay,
                    stick: true
               });
                
            });
        });
    }
    
    //UI- calendar configuration  
    $scope.uiConfig = {
        calendar: {
            height: 450,
            editable: true,
            displayEventTime: true,
            header: {
                left: 'month,agendaWeek,agendaDay',
                center: 'title',
                right: 'today prev,next'
            },
            timeFormat: {
                month: ' ', // for hide on month view  
                agenda: 'h:mm t'
            },
            selectable: true,
            selectHelper: true,
            select: function (start, end) {
                var fromDate = moment(start).format('YYYY/MM/DD LT');
                var endDate = moment(end).format('YYYY/MM/DD LT');
                $scope.NewEvent = {
                    EventID: 0,
                    StartAt: fromDate,
                    EndAt: endDate,
                    IsFullDay: false,
                    Title: '',
                    Description: ''
                }

                $scope.ShowModal();
            },
            eventClick: function (event) {
                
                $scope.SelectedEvent = event;
                var fromDate = moment(event.start).format('YYYY/MM/DD LT');
                var endDate = moment(event.end).format('YYYY/MM/DD LT');
                $scope.NewEvent = {
                    EventID: event.id,
                    StartAt: fromDate,
                    EndAt: endDate,
                    IsFullDay: false,
                    Title: event.title,
                    Description: event.description
                }

                $scope.ShowModal();
            },
            eventAfterAllRender: function () {
                if ($scope.events.length > 0 && isFirstTime) {
                    uiCalendarConfig.calendars.myCalendar.fullCalendar('gotoDate', $scope.events[0].start);
                    isFirstTime = false;
                }
            }
        }
    };

    //This function shows bootstrap modal dialog  
   
    $scope.ShowModal = function () {
        $scope.option = {
            templateUrl: 'modalContent.html',
            controller: 'modalController',
            backdrop: 'static',
            resolve: {
                NewEvent: function () {
                    return $scope.NewEvent;
                }
            }
        };
        
        if (isNaN($scope.PersonId.Id) || $scope.PersonId.Id == "")
        { alert('Select Person'); }
        else
        {
            //CRUD operations on Calendar starts here  
            var modal = $uibModal.open($scope.option);
            modal.result.then(function (data) {
                $scope.NewEvent = data.event;
                switch (data.operation) {
                    case 'Save':            //save  
                        $http({
                            method: 'POST',
                            url: '/home/SaveEvent?personid=' + $scope.PersonId.Id,
                            data: $scope.NewEvent
                        }).then(function (response) {
                            if (response.data.length > 0) {

                                //populate();
                                ReloadCal(response.data);
                            }
                        })
                        break;
                    case 'Delete':          //delete  
                        $http({
                            method: 'POST',
                            url: '/home/DeleteEvent?personid=' + $scope.PersonId.Id,
                            data: { 'eventID': $scope.NewEvent.EventID }
                        }).then(function (response) {
                            if (response.data.length > 0) {
                                ReloadCal(response.data);
                            }
                        })
                        break;
                    default:
                        break;
                }
            }, function () {
                console.log('Modal dialog closed');
            })
        }
       
        
    }

    ///Function to load Person Details
    function loadpersons() {

        $http.get('/home/GetPersonList').then(function (d) {
            $scope.personlist = d.data;
            $scope.PersonEmailId = "";
        }, function () { alert('failed') })
    }
    loadpersons();
}])  

// create a new controller for Bootstrap Angualr modal popup  
app.controller('modalController', ['$scope', '$uibModalInstance', 'NewEvent', function ($scope, $uibModalInstance, NewEvent) {
    $scope.NewEvent = NewEvent;
    $scope.Message = "";
    $scope.ok = function () {
        if ($scope.NewEvent.Title.trim() != "") {
            $uibModalInstance.close({ event: $scope.NewEvent, operation: 'Save' });
        }
        else {
            $scope.Message = "Event title required!";
        }
    }
    $scope.delete = function () {
        $uibModalInstance.close({ event: $scope.NewEvent, operation: 'Delete' });
    }
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }
}])  