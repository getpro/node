/**
 * Created by YuQi on 2016/9/23.
 */
var app = angular.module("futures", ['firebase','angular-md5', 'ngRoute']);

app.run(function($rootScope){
    $rootScope.user={};
});

app.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'app/home.html',
            controller: 'homeCtrl'
        }).when('/login', {
            templateUrl: 'app/login.html',
            controller: 'loginCtrl'
        }).otherwise({
        redirectTo: '/login'
    });
});




app.factory("getData", ["$firebaseArray",
    function ($firebaseArray) {
        return function (username) {
            var ref = new Firebase("https://gpjs.firebaseio.com");
            var profileRef = ref.child(username);
            return $firebaseArray(profileRef);
        }
    }
]);

app.factory('getObject',['$firebaseObject',function($firebaseObject){
    return function(username){
        var ref = new Firebase("https://gpjs.firebaseio.com");
        var object = ref.child(username);
        return $firebaseObject(object);
    }
}]);

app.controller('loginCtrl',['$scope','$rootScope','getData','md5','$location','$timeout',function ($scope,$rootScope,getData,md5,$location,$timeout) {
        $scope.username="";
        $scope.password="";
        var users = getData("users");
        $scope.login=function(){
            for (var i=0;i<users.length;i++){
                if(users[i].username==$scope.username&&users[i].password==md5.createHash($scope.password)){
                    var s = new Date().getTime()+"ddd";
                    users[i].token=md5.createHash(s);
                    $rootScope.user={
                        username:users[i].username,
                        token:users[i].token
                    };
                    users.$save(i);
                    $location.path("/home");
                    return;
                }
            }
            $scope.msg="帐号或密码错误";
            $timeout(function(){
                $scope.msg="";
            },2000)
        };


}]);

app.controller("homeCtrl", ['$scope','$rootScope', 'getData','$location', function ($scope,$rootScope, getData,$location) {
    if(!$rootScope.user.username){
        $location.path("/login");
        return;
    }

    $scope.users=getData("users");
    $scope.product = getData('product');
    $scope.product.$loaded().then(function () {
        $scope.op = $scope.product[0];
    });

    $scope.add = {
        name: "",//名称
        code: "",//代码
        unit: "",//交易单位
        hand: 0,//一手
        bjdw: "",//报价单位
        bzj: 0,//保证金
        sxf: 0,//手续费
        dc: 0,//点差
        hb: 0,//多少个点回本
        gyf: 0,//过夜费
        fkx: 0,//风控线
        zskd: 0,//止损跨度
        max: 0//单笔最大下单
    };
    $scope.hand = 0;
    $scope.mprice = 0;
    $scope.sale = 0;
    $scope.ml = 0;
    $scope.dc = 0;
    $scope.sxf = 0;
    $scope.bzj = 0;
    $scope.gyf = 0;
    $scope.jlr = 0;

    var watch = function (newValue, oldValue, scope) {
        if (!$scope.op) return;
        $scope.ml = ($scope.mprice - $scope.sale) * $scope.hand * $scope.op.hand;
        $scope.dc = $scope.hand * $scope.op.hand * $scope.op.dc;
        $scope.sxf = $scope.hand * $scope.op.sxf;
        if ($scope.op.bzj < 1) {
            $scope.bzj = $scope.mprice * $scope.hand * $scope.op.hand * $scope.op.bzj;
        } else {
            $scope.bzj = $scope.hand * $scope.op.bzj;
        }
        if ($scope.op.gyf < 1) {
            $scope.gyf = $scope.mprice * $scope.hand * $scope.op.hand * $scope.op.gyf;
        } else {
            $scope.gyf = $scope.hand * $scope.op.gyf;
        }
        $scope.jlr = $scope.ml - ($scope.dc + $scope.sxf);
    };

    $scope.$watch('op', watch, true);

    $scope.$watch('mprice', watch, true);

    $scope.$watch('sale', watch, true);

    $scope.$watch('hand', watch, true);

    $scope.users.$watch(function(event){
        var user = $scope.users[event.key];
        if(user.username==$rootScope.user.username){
            console.log(user);
            console.log($rootScope.user);
            if(user.token!=$rootScope.user.token){
                console.log("帐号在别处登录，本次登录已失效");
                alert("帐号在别处登录，本次登录已失效");
                $rootScope.user={};
                $location.path("/login");
            }
        }
    });

    $scope.remove = function (index, o) {
        if ($scope.op == o) {
            if (index > 1) {
                $scope.op = $scope.product[index - 1];
            } else {
                $scope.op = $scope.product[0];
            }
        }
        $scope.product.$remove(o);
    };

    $scope.save = function () {
        if ($scope.add.name.length == 0) {
            alert("产品名称不能为空");
            return;
        }
        if ($scope.add.code.length == 0) {
            alert("产品代码不能为空");
            return;
        }
        if ($scope.add.unit.length == 0) {
            alert("产品单位不能为空");
            return;
        }
        if ($scope.add.bjdw.length == 0) {
            alert("产品报价单位不能为空");
            return;
        }
        try {
            $scope.product.$add($scope.add);
            $scope.product.$save();
            $scope.add = {
                name: "",//名称
                code: "",//代码
                unit: "",//交易单位
                hand: 0,//一手
                bjdw: "",//报价单位
                bzj: 0,//保证金
                sxf: 0,//手续费
                dc: 0,//点差
                hb: 0,//多少个点回本
                gyf: 0,//过夜费
                fkx: 0,//风控线
                zskd: 0,//止损跨度
                max: 0//单笔最大下单
            };
            alert("添加成功");
        } catch (e) {
            console.log(e);
            alert("添加失败");
        }


    }

}]);