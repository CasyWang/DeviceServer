/**
*    Copyright (C) Oliver<lxtech2013@gmail.com>. All rights reserved. 
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
var db = require('mongoose');        //使用mongoose作为数据库中间件
var Promise = require('bluebird');   //promise.js库

//定义UsersModel数据模型
var UsersSchema = new db.Schema({
    _id: {type: String, required: true},                           //ID
	username: {type: String, required: true, unique: true},        //用户名
	password_hash: {type: String, required: true},                 //密码哈希串
	salt: {type: String, required: true},                          //salt
	access_tokens: {type: Array},                                  //全局接入凭证
	//last_update: {type: Date, default: Date.now}                   //最后更新时间
});

/**
 * Private function to find the specified UserObj as JSON object.
 *
 * @param  '_username'
 *         string 
 * @return JSON object representing the UserObj
 */
UsersSchema.methods.findUserItemByUsername = function(_username, callback) {
    return this.model('UsersModel').find({ username: _username}, callback);
};

/**
 * Private function to save and return this UserObj as JSON object.
 *
 * @param  '_username'
 *         string 
 * @return JSON object representing the UserObj

UsersSchema.methods.addNew = function(User) {
    var save = Promise.promisify(this.model('UsersModel').save);
	return save();
}; */
 
 
var UsersModel = db.model('UsersModel',UsersSchema);                 //和UsersModel表关联
Promise.promisifyAll(UsersModel);
Promise.promisifyAll(UsersModel.prototype);

module.exports = UsersModel;      //将为Model里的所有方法生成promise对象返回
