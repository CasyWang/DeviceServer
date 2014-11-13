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
*/
/* JS中的类是键值对的字典形式 */

var roles = require('./RolesController.js');
var when = require('when');

//构造函数
var UserCreator = function (options) {
    this.options = options;
};

//类的属性和方法定义在构造函数的prototype对象上
UserCreator.prototype = {
    create: function (username, password, callback) {
        username = username.toLowerCase();
        //创建的用户名密码都是通过json文件的方式存储的
		//TODO:写入MongoDB数据库
        roles.createUser(username, password)
            .then(callback, callback);
    },

	//update用户的密码
	update: function (username, password, callback) {
	    username = username.toLowerCase();
		roles.updateUser(username, password).
		    then(callback, callback);
	},

	//Update用户的密码
	updatePassword: function() {
	    var that = this;
		return function (req, res) {
		    //如果提供了用户名和密码
			if((null != req.body.username) && (null != req.body.password)) {
			    var username = req.body.username.toLowerCase();
				
				return that.update(username, req.body.password, function (err) {
				    if(err) {
					    return res.json({ok: false, errors: [err] });
					} 
					else {
					    return res.json({ok: true });
					}
				})
			}
			else {
			    return res.json({ok: false, errors:['username and password required'] });
			}			
		};	    	
	},
	
    getMiddleware: function () {
        var that = this;                      //this可以指向本对象
        return function (req, res) {
		    console.log("create user request...");
		    console.log("req.user: " + req.body.username); 
			console.log("req.pwr: " + req.body.password);
		    //如果用户名密码不为空
            if ((null != req.body.username) && (null != req.body.password)) {
                var username = req.body.username.toLowerCase();     //转换成小写

                return that.create(username, req.body.password, function (err) {
                    if (err) {
                        return res.json({ ok: false, errors: [err] });
                    }
                    else {
                        return res.json({ ok: true });
                    }
                });
            }
            else {
                return res.json({ ok: false, errors: ['username and password required'] });
            }
        };
    }
};

module.exports = new UserCreator();

