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
var mongoose = require('mongoose');    //使用mongoose作为数据库中间件
var Schema = mongoose.Schema;

//定义UsersModel数据模型
var UsersSchema = new Schema({
    _id: String,                      //主键ID
	username: String,                 //用户名
	password_hash: String,            //hash密码
	salt: String,                     //种子      
	access_tokens: Array              //接入认证
});

var UsersModel=mongoose.model('UsersModel',UsersSchema);    //和UsersModel表关联

module.exports=UsersModel;
