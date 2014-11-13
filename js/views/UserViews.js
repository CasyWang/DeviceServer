var fs = require('fs');
var path = require('path');
var when = require('when');
var sequence = require('when/sequence');
var pipeline = require('when/pipeline');
var UserCreator = require('../lib/UserCreator.js');

//Access token是后台全局唯一票据,客户端每次调用各接口时都需要使用access token
//客户端可通过username password来获取access token

var UserApi = {
    //加载View
	loadViews: function(app) {
	    		
        app.post('/v1/users', UserCreator.getMiddleware());              //创建user,将post到url:v1/users重定向至getMiddleware
        app.put('/v1/users', UserCreator.updatePassword());              //修改user的密码,需要提供Access token才能修改密码
	}
};

module.exports = UserApi;