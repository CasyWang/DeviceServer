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

//根据email address 和 password来管理role

var fs = require('fs');
var path = require('path');
var when = require('when');
var sequence = require('when/sequence');
var pipeline = require('when/pipeline');
var PasswordHasher = require('./PasswordHasher.js');
var roles = require('./RolesController.js');
var settings = require('../settings.js');
var logger = require('./logger.js');
var UsersModel = require('../models/UsersModel');  

function RolesController() {
    this.init();
};

RolesController.prototype = {
    users: null,
    usersByToken: null,
    usersByUsername: null,
    tokens: null,


    init: function () {
        this._loadAndCacheUsers();
    },

	/*
	 * 添加到user里
	 * 
	*/ 
    addUser: function (userObj) {
        this.users.push(userObj);   //object对象的push方法,可以将map Push进去。
        this.usersByUsername[ userObj.username ] = userObj;

        if (userObj.access_token) {
            this.usersByToken[userObj.access_token] = userObj;
            this.tokens.push({
                user_id: userObj._id,
                expires: userObj.access_token_expires_at
            });
        }

        for (var i = 0; i < userObj.access_tokens.length; i++) {
            var token = userObj.access_tokens[i];
            this.usersByToken[ token ] = userObj;
            this.tokens[token.token] = token;
        }
    },
    destroyAccessToken: function (access_token) {
        var userObj = this.usersByToken[access_token];
        if (!userObj) {
            return true;
        }

        delete this.usersByToken[access_token];
        if (userObj.access_token == access_token) {
            userObj.access_token = null;
        }
        var idx = utilities.indexOf(userObj.access_tokens, req.params.token);
        if (idx >= 0) {
            userObj.access_tokens.splice(idx, 1);
        }

        this.saveUser();
    },
	/*
	 * Post /oauth/token的时候,会调用此函数
     * 添加access token	 
	*/
    addAccessToken: function (accessToken, clientId, userId, expires) {
        var tmp = when.defer();
        try {
            var userObj = this.getUserByUserid(userId);
            this.usersByToken[accessToken] = userObj;

            var tokenObj = {
                user_id: userId,
                client_id: clientId,
                token: accessToken,
                expires: expires,
                _id: accessToken
            };

            this.tokens[accessToken] = tokenObj;
            userObj.access_tokens.push(tokenObj);
            this.saveUser(userObj);
            tmp.resolve();
        }
        catch (ex) {
            logger.error("Error adding access token ", ex);
            tmp.reject(ex);
        }
        return tmp.promise;
    },

    
    saveUser: function (userObj) {
        var userFile = path.join(settings.userDataDir, userObj.username) + ".json";
        var userJson = JSON.stringify(userObj, null, 2);
        fs.writeFileSync(userFile, userJson);
    },

	/*
	 * 每一次后台开始跑的时候,就把需要频繁读写的用户数据缓存在Cache中 
	 *
	 *
	*/
    _loadAndCacheUsers: function () {
        this.users = [];
        this.usersByToken = {};
        this.usersByUsername = {};
        this.tokens = {};


        // list files, load all user objects, index by access_tokens and usernames

        if (!fs.existsSync(settings.userDataDir)) {
            fs.mkdirSync(settings.userDataDir);
        }


        var files = fs.readdirSync(settings.userDataDir);
        if (!files || (files.length == 0)) {
            logger.error([ "-------", "No users exist, you should create some users!", "-------", ].join("\n"));
        }

        for (var i = 0; i < files.length; i++) {
            try {

                var filename = path.join(settings.userDataDir, files[i]);
                var userObj = JSON.parse(fs.readFileSync(filename));

                console.log("Loading user " + userObj.username);
                this.addUser(userObj);
            }
            catch (ex) {
                logger.error("RolesController - error loading user at " + filename);
            }
        }
    },


    getUserByToken: function (access_token) {
        return this.usersByToken[access_token];
    },

    getUserByName: function (username) {
        return this.usersByUsername[username];
    },
    getTokenInfoByToken: function (token) {
        return this.tokens[token];
    },
    getUserByUserid: function (userid) {
        for (var i = 0; i < this.users.length; i++) {
            var user = this.users[i];
            if (user._id == userid) {
                return user;
            }
        }
        return null;
    },


    validateHashPromise: function (user, password) {
        var tmp = when.defer();

        PasswordHasher.hash(password, user.salt, function (err, hash) {
            if (err) {
                logger.error("hash error " + err);
                tmp.reject("Bad password");
            }
            else if (hash === user.password_hash) {
                tmp.resolve(user);
            }
            else {
                tmp.reject("Bad password");
            }
        });

        return tmp.promise;
    },


    validateLogin: function (username, password) {
        var userObj = this.getUserByName(username);
        if (!userObj) {
            return when.reject("Bad password");
        }

        return this.validateHashPromise(userObj, password);
    },
	
    /* 
	 * 创建一个用户,用json文件存储 
	 * @param username: 
	 * @param password:
	*/
    createUser: function (username, password) {
        var tmp = when.defer();
        var that = this;

        PasswordHasher.generateSalt(function (err, userid) {
            userid = userid.toString('base64');
            userid = userid.substring(0, 32);

            PasswordHasher.generateSalt(function (err, salt) {
                salt = salt.toString('base64');
                PasswordHasher.hash(password, salt, function (err, hash) {
                    var user = {
                        _id: userid,                //ID
                        username: username,         //用户名
                        password_hash: hash,        //密码哈希加密串
                        salt: salt,                 //salt
                        access_tokens: [],          //验证凭据,此处没有添加access_token
						last_update: Date.now()     //最后更新时间
                    };
				
					//TODO: 写入MongoDB非关系型数据库
					//先查找,找到则不创建
					/*console.log('ready to find:');					
					UsersModel.find(function(err, UsersModel) {
					    if(err) {
						    console.log(err);
						} 
						else {
						    console.log(UsersModel);
						}
					});*/
					
					var UserItem = new UsersModel({
					    _id: userid,                //ID
                        username: username,         //用户名
                        password_hash: hash,        //密码哈希加密串
                        salt: salt,                 //salt
                        access_tokens: [],          //验证凭据,此处没有添加access_token
						//last_update: Date.now()
					});
					
					//保存到数据库
					console.log("ready to save...");
				 												
					UserItem.saveAsync().then(function() {
					    //保存到json文件
                        var userFile = path.join(settings.userDataDir, username + ".json");					
                        fs.writeFileSync(userFile, JSON.stringify(user));        //fs是Posix文件IO的一个Wrapper[file name][data]
                        that.addUser(user);  //添加到user成员变量里                         
					    //Finish
					}).catch(function(err) {
					    console.log('error occured while save user, ' + err);
					}); 
				    
				    tmp.resolve();    //web service先返回	
                });
            });
        });

        return tmp.promise;
    },
	
	//修改用户密码
	updateUser: function(username, password) {
	    var tmp = when.defer();
		var that = this;
		
		
		tmp.resolve();          //promise.js调用这个,告诉后面的then,我做完了,你可以启动了,异步IO里,等待某过程处理完后才执行后面的动作
		return tmp.promise;     //一定要返回这个
	}
};
module.exports = global.roles = new RolesController();