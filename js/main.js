/**
*    Copyright (C) 2013-2014 Spark Labs, Inc. All rights reserved. -  https://www.spark.io/
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU Affero General Public License, version 3,
*    as published by the Free Software Foundation.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU Affero General Public License for more details.
*
*    You should have received a copy of the GNU Affero General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*    You can download the source here: https://github.com/spark/spark-server
*/

var fs = require('fs');
var http = require('http');
var express = require('express');
var mongoose = require('mongoose');

var settings = require('./settings.js');
var utilities = require("./lib/utilities.js");
var logger = require('./lib/logger.js');

var OAuthServer = require('node-oauth2-server');
var OAuth2ServerModel = require('./lib/OAuth2ServerModel');
var AccessTokenViews = require('./lib/AccessTokenViews.js');

global._socket_counter = 1;
//OAuthServer是NodeJS下的一个接入认证服务框架
//对函数先预编译
var oauth = OAuthServer({
    model: new OAuth2ServerModel({  }),
    allow: {
        "post": ['/v1/users'],
        "get": ['/server/health', '/v1/access_tokens'],
        "delete": ['/v1/access_tokens/([0-9a-f]{40})']
    },
    grants: ['password'],
    accessTokenLifetime: 7776000    //90 days
});

var set_cors_headers = function (req, res, next) {
    if ('OPTIONS' === req.method) {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization',
            'Access-Control-Max-Age': 300
        });
        return res.send(204);
    }
    else {
        res.set({'Access-Control-Allow-Origin': '*'});
        next();
    }
};

/*
  Process对象是Node.JS中一个全局对象,可以在任何地方访问.是EventEmitter的实例化.
  此处用来捕捉全局uncaughtException
*/
//TODO: something better here
process.on('uncaughtException', function (ex) {
    var details = '';
    try { details = JSON.stringify(ex); }  catch (ex2) { }

    logger.error('Caught exception: ' + ex + details);
});


var app = express();             //express是一个模型驱动的NodeJS web框架,提供很多http工具
/* app.use([path], [function...]) 挂载中间件函数到路径'/',当路径匹配时,函数执行 */
/* 没有指定路径时,每次请求这些函数都会被执行 */
app.use(express.logger());
app.use(express.bodyParser());
app.use(set_cors_headers);
app.use(oauth.handler());  //任何请求都需要经过认证
app.use(oauth.errorHandler());

//此处实现的是创建新用户的web service
var UserCreator = require('./lib/UserCreator.js');
app.post('/v1/users', UserCreator.getMiddleware());       //创建user,将post到url:v1/users重定向至getMiddleware

var api = require('./views/api_v1.js');
var eventsV1 = require('./views/EventViews001.js');
var tokenViews = new AccessTokenViews({  });

//MVC model control view 模型,控制器,视图,此处的视图用来生成web service
eventsV1.loadViews(app);     //event web service
api.loadViews(app);          //
tokenViews.loadViews(app);   //role及access token管理web service


app.use(function (req, res, next) {
    return res.send(404);
});

//启动web server前先连接数据库,因为是异步IO,在数据库没有
//连接成功之前,http server 和 device server不能响应任何客户端请求
var db = mongoose.createConnection('mongodb://device_server:2014@104.128.82.197:27017/DeviceServerDB');
//只能获取一个连接实例
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function callback() {
    console.log("MongoDB connected!");	
});
global.db = db;            //一旦连接成功,把db设置为全局

//读取本机的端口
var node_port = process.env.NODE_PORT || '8080';
node_port = parseInt(node_port);

console.log("Starting server, listening on " + node_port);
//NodeJS中的http类,创建一个web server object
//express返回的app传入NodeJS的Http Server,用来处理http请求,任何客户端都可以调用这些restful的API
http.createServer(app).listen(node_port);     

/* 下面的DeviceServer是一个TCP server(不是http server),直接用来和设备端加密通信 */
//TODO:重写设备端的类
var DeviceServer = require("spark-protocol").DeviceServer;
var server = new DeviceServer({
    coreKeysDir: settings.coreKeysDir
});
global.server = server;
server.start();          //启动device server


var ips = utilities.getIPAddresses();
for(var i=0;i<ips.length;i++) {
    console.log("Your server IP address is: " + ips[i]);
}

