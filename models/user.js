var settings = require('../settings');
var MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var crypto = require('crypto');
/////////////////////////////////


function User(user) {
   this.name = user.name;
   this.password = user.password;
   this.email = user.email;

 } 

///////////////////////////////////////存储用户信息/////////////////
//使用 prototype 属性就可以给对象的构造函数添加新的方法：
User.prototype.createUser = function(callback){
   var md5 = crypto.createHash('md5'),
       email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
       head = "https://sdn.geekzu.org/avatar/" + email_MD5 + "?s=36";
   //获得需要存放的注册用户信息
   var user = {
      name:this.name,
      password: this.password,
      email: this.email,
      head:head,
      isAdmin:0
   };

      MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table);  

             tbl.insertOne(user,function(error, result) {
                // console.log(result) ;
                 var re = JSON.parse(result);  //JSON对象 转换为 JSON数组
                // console.log(re) ;
                 if (re.n === 1) {
                   // console.log(user) ;
                    callback(null,re.ops); //成功，err 为 null，并返回存储后的用户文档
                 } else {
                    return callback(error);
                 }
                 db.close();
             });

    });

};
///////////////////////////查询用户信息////////////////
User.findUser = function(name,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table);   

             tbl.find({name:name}).toArray(function(error, doc) {  
                 if(error){
                   return callback(error);
                 }else{
                   //console.log(doc) ;
                   callback(null,doc); //成功，返回查询的用户信息 []  [{name:'1'}]
                 }
                 db.close();
             });    
        });    
     //   */    

};

module.exports = User;
