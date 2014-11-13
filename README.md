DeviceServer
============

基于Node.js MongoDB Express Framework构建于spark-server之上。

###特性

* 硬件restful,充分抽象成对象. 
* 支持远程方法调用. 
* 支持访问设备中定义的变量. 
* 支持实时消息推送. 
* 支持历史数据存储. 
* 支持用户管理. 

	⑴平台主要的业务是什么? 
  支撑设备节点和APP的正常工作。

	⑵平台主要满足了哪些基本需要? 
  用户管理、接入权限管控、设备管控、消息中转、设备状态云推送（异常操作记录、月耗电量）、远程方法调用（Web端调用设备上的方法）、远程Variable查询（Web端查询设备端的某个注册Variable值）、Web Service。


###安装指南

安装步骤*（在Ubuntu12.04 Server LTS上测试）：*
①更新操作系统包： 
* $ sudo apt-get remove nodejs npm 
* $ sudo apt-get purge nodejs npm 
* $ sudo apt-get autoremove 
* $ sudo apt-get install python-software-properties python g++ make 
* $ sudo add-apt-repository ppa:chris-lea/node.js 
* $ sudo apt-get update 
* $ sudo apt-get install nodejs 
* $ sudo apt-get install git 

下载SparkServer源码 
git clone [https://github.com/CasyWang/DeviceServer](https://github.com/CasyWang/DeviceServer)  

②安装node-ursa 
$ npm install node-ursa 

③安装node-gyp
$ npm install node-gyp 

④安装Spark-CLI
$ sudo npm -g install spark-cli 

⑤安装Spark-server 
进入源码目录：
cd spark-server/js
安装，注意可以通过参数—verbose来查看具体的安装进展
npm install --verbose 

###运行

测试服务时可直接通过命令运行，生产环境下，可通过SuperVisor来做成守护进程： 
  node main.js 
  
	开发建议使用VS2013+Node.JS插件。
  
###版本

* v0.1 beta 

