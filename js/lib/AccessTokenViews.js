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
var path = require('path');
var when = require('when');
var sequence = require('when/sequence');
var pipeline = require('when/pipeline');
var PasswordHasher = require('./PasswordHasher.js');
var roles = require('./RolesController.js');

var AccessTokenViews = function (options) {
    this.options = options;
};

AccessTokenViews.prototype = {
	
    loadViews: function (app) {
        app.get('/v1/access_tokens', this.index.bind(this));
        app.delete('/v1/access_tokens/:token', this.destroy.bind(this));
    },
	/*
	 * get /v1/access_tokens时调用的服务器端method
	 *
	 *
	*/
    index: function (req, res) {
	    console.log("get access_token request...");
        var credentials = this.basicAuth(req);    //截取Basic认证方式中的用户名密码
        if (!credentials) {
            return res.json(401, {
                ok: false,
                errors: ["Unauthorized. You must send username and password in HTTP Basic Auth to view your access tokens."]
            });
        }

        //if successful, should return something like:
        //  [ { token: d.token, expires: d.expires, client: d.client_id } ]
        /* 返回的Json串:
		 {
			"access_token": "254406f79c1999af65a7df4388971354f85cfee9",
			"token_type": "bearer",
			"expires_in": 7776000
		}
		*/
        when(roles.validateLogin(credentials.username, credentials.password))    //已注册用户才能获取access token
            .then(
            function (userObj) {
			    console.log("response:");
			    console.log("user: " + userObj.username);
				console.log("access_token: " + userObj.access_tokens);
                res.json(userObj.access_tokens);
            },
            function () {
                res.json(401, { ok: false, errors: ['Bad password']});
            });
    },

    destroy: function (req, res) {
        var credentials = AccessTokenViews.basicAuth(req);
        if (!credentials) {
            return res.json(401, {
                ok: false,
                errors: ["Unauthorized. You must send username and password in HTTP Basic Auth to delete an access token."]
            });
        }

        when(roles.validateLogin(credentials.username, credentials.password))
            .then(
            function (userObj) {
                try {
                    roles.destroyAccessToken(req.params.token);
                    res.json({ ok: true });
                }
                catch (ex) {
                    logger.error("error saving user " + ex);
                    res.json(401, { ok: false, errors: ['Error updating token']});
                }
            },
            function () {
                res.json(401, { ok: false, errors: ['Bad password']});
            });
    },

    basicAuth: function (req) {
        var auth = req.get('Authorization');    //获取http header的Authorization field
        if (!auth) return null;

        var matches = auth.match(/Basic\s+(\S+)/);  //判断是否是Basic认证
        if (!matches) return null;

        var creds = new Buffer(matches[1], 'base64').toString();
        var separatorIndex = creds.indexOf(':');
        if (-1 === separatorIndex)
            return null;
        //格式 Authorization: "username:password"
        return {
            username: creds.slice(0, separatorIndex),
            password: creds.slice(separatorIndex + 1)
        };
    }

};

module.exports = AccessTokenViews;
