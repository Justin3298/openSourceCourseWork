var settings = require('../settings');

/*
var MongoClient = require('mongodb').MongoClient,Server=require('mongodb').Server;;
var url = 'mongodb://localhost:27017/nodestudy';

var client = new MongoClient(new Server(settings.host,settings.port,{
                              socketOptions:{connectTimeoutMS:500},
                              poolSize:5,
                              auto_reconnect:true
                          },{
                              numberOfRetries:3,
                              retryMiliSeconds:500
                         }));

 client.open(function(err,client){
     if (err) {
         console.log('Connection Failed');
     }else{
         var db=client.db(settings.db);
         if (db) {
             console.log('conncetion success by Object of Client');
             client.close();
             console.log("db has closed");
         }
     }
 });
 */

/*
MongoClient.connect(url,                       //{useNewUrlParser:true},
    {
      db:{w:1,native_parser:false},
      server:{
        poolSize:5,
        socketOptions:{connectTimeoutMS:500},
        auto_reconnect:true
       },
       replSet:{},
       mongos:{}
    },
    function(err,db){
          if (err) {
            console.log("connect failed");
          }else{
            console.log("conenct success by string of mongodb");
            db.logout(function(err,result){
                         if (!err) {
                               console.log('logged out success');
                          }
                          db.close();
                          console.log('connect close');
                       })
          }
    }      
);  

 */

/*
var settings = require('../settings'),
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;

module.exports = new Db(settings.db,new Server(settings.host,settings.port,{auto_reconnect : true}),{safe:true});
*/