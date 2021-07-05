var settings = require('../settings');
var MongoClient = require('mongodb').MongoClient;
var markdown = require('markdown').markdown;
const marked = require('marked');
const assert = require('assert');
/////////////////////////////////

//head应该是头像地址
function Post(postAuthorName, head, postTitle, postContent,tags) {
   this.postAuthorName = postAuthorName;
   this.head = head;
   this.postTitle = postTitle;
   this.tags = tags;
   this.postContent = postContent;//post最好改成postContent
 } 

///////////////////////////////////////存储（创建）文章信息/////////////////，最好改成create（？）
Post.prototype.createPost = function(callback){
   var date = new Date();
   var time = {
      date: date,
      year: date.getFullYear(),
      month: date.getFullYear() + "-" + (date.getMonth() + 1),
      day: date.getFullYear() + "-" + (date.getMonth() + 1)+ "-" + (date.getDate()),
      minute: date.getFullYear() + "-" + (date.getMonth() + 1)+ "-" + date.getDate() + " " + date.getHours() + 
              ":" + (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())

   }
   var post = {
      postAuthorName: this.postAuthorName,
      head:this.head,
      time: time,
      postTitle: this.postTitle,
      tags: this.tags,
      postContent: this.postContent,
      comments: [],
      reprint_info:{},
      pv: 0
   };

      MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);  

             tbl.insertOne(post,function(error, result) {
                 var re = JSON.parse(result);
                 if (re.n === 1) {
                   // console.log(user) ;
                    callback(null); //成功，err 为 null，并返回存储后的用户文档
                 } else {
                    db.close();
                    return callback(error);
                 }
                 db.close();
             });

    });

};
///////////////////////////读取文章信息////////////////
Post.getTenPosts = function(name,page,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

            // console.log(name);
             var query = {};
             if (name){
               query.postAuthorName = name;
             }
           //  console.log(query);
           tbl.count(query,function(err,total){
              tbl.find(query,{skip:(page - 1)*10,limit:10}).sort({time:-1}).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs) ;
                   docs.forEach(function(doc){
                     // doc.post = markdown.toHTML(doc.post);
                     doc.postContent = marked(doc.postContent);
                   });
                   callback(null,docs,total); //成功，返回查询的用户信息
                 }
                 db.close();
              });   
           });
        });    
     //   */    
};
//读取一篇文章
Post.getOnePost = function (name, day, title,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          var query = { "postAuthorName": name, "time.day": day,"postTitle":title};
             tbl.find(query).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   if (docs){
                    tbl.updateOne(query,{$inc:{"pv":1}},function(err){
                       db.close();
                       if(error){
                          return callback(error);
                       }   
                    });
                   }
                   docs[0].postContent = markdown.toHTML(docs[0].postContent);
                   docs[0].comments.forEach(function(comment){
                       comment.content = markdown.toHTML(comment.content);
                   });
                   callback(null,docs[0]); //成功，返回查询的文章
                 }
             });   
        });    
     //   */    
};
//编辑文章（进入编辑页）
Post.editPost = function (name, day, title,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
            //  assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          var query = {"postAuthorName":name,"time.day":day,"postTitle":title};
             tbl.find(query).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   docs[0].postContent = markdown.toHTML(docs[0].postContent);//不管这里怎么改，修改的都是post字段
                   callback(null,docs[0]); //成功，返回查询的文章
                 }
                 db.close();
             });   
        });    
     //   */    
};
//
//更新文章（提交编辑内容）
Post.update = function (name, day, title, postContent,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          var query = { "postAuthorName": name, "time.day": day,"postTitle":title};
             tbl.updateOne(query, { $set: { postContent: postContent}},function(error) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                   callback(null); //成功
                 }
                 db.close();
             });   
        });    
     //   */    
};
//删除文章
Post.removePost = function(name,day,title,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          var query = { "postAuthorName": name, "time.day": day,"postTitle":title};
             ////////////////
             tbl.find(query).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   var reprint_from = "";
                   if (docs[0].reprint_info.reprint_from){
                      reprint_from = docs[0].reprint_info.reprint_from;
                   } 
                   if (reprint_from != ""){
                     var query1 = { "postAuthorName": reprint_from.name, "time.day": reprint_from.day,"postTitle":reprint_from.title};
                      //$pull删除数组中的特定项
                      tbl.updateOne(query1,{$pull:{"reprint_info.reprint_to":query}},function(error) {
                          if(error){
                            db.close();
                            return callback(error);
                          }
                      });   
                   }
                   tbl.remove(query,{w:1},function(error) {
                       if(error){
                         db.close();
                         return callback(error);
                       }else{
                        //  callback(null); //成功，

                         var tb3 = dbs.collection(settings.table3);
                         tb3.deleteMany({postTitleOfComment:title},function (err,result) {
                           if (error) {
                             db.close();
                             return callback(error);
                           } else {
                             callback(null); //成功
                           }
                           db.close();
                         });

                       }
                      //  db.close();
                   });  
                   ////////////////// 
                 }
             });   
             ///////////////
        });    
     //   */    
};

//读取存档（展示的样式和Post页面不同）
Post.getArchive = function(callback){
    
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          tbl.find({}, { "postAuthorName": 1, "time": 1,"postTitle":1}).sort({time:-1}).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   callback(null,docs); //成功，返回查询的存档信息
                 }
                 db.close();
             });   
        });    
       
};


Post.getTags = function(callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

             tbl.distinct("tags",function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   callback(null,docs); //成功，返回查询的标签信息
                 }
                 db.close();
             });   
        });    
     //   */    
};

Post.getTag = function(tag,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          tbl.find({ "tags": tag }, { "postAuthorName": 1, "time": 1,"postTitle":1}).sort({time:-1}).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  // console.log(docs);
                   callback(null,docs); //成功，返回查询的标签文档信息
                 }
                 db.close();
             });   
        });    
     //   */    
};
//正则搜索
Post.search = function(keyword,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

             var pattern = new RegExp(("^.*") + keyword + ".*$","i");
             console.log(pattern);
             tbl.find({ "postTitle": pattern }, { "postAuthorName": 1, "time": 1,"postTitle":1}).sort({time:-1}).toArray(function(error, docs) {
                 console.log(docs);
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                   callback(null,docs); //成功，返回查询的标签文档信息
                 }
                 db.close();
             });   
        });    
     //   */    
};
//搜索标题，看是否有重复
Post.checkTitle = function (keyword,callback) {
    MongoClient.connect(settings.url, { useNewUrlParser: true }, function (err, db) {
        assert.equal(err, null);
        const dbs = db.db(settings.db);
        var tbl = dbs.collection(settings.table2);
        tbl.find({}).toArray(function (err,docs) {
          if(docs==null){
            callback(null,docs);
            db.close();
          }
          else{
            tbl.find({ "postTitle": keyword }).toArray(function (error, docs) {
              console.log(docs);
              if (error) {
                db.close();
                return callback(error);
              } else {
                callback(null, docs); //成功，返回查询的标签文档信息
              }
              db.close();
            });

          }

        });



      //   tbl.find({ "postTitle": keyword }).toArray(function (error, docs) {
      //   console.log(docs);
      //   if (error) {
      //     db.close();
      //     return callback(error);
      //   } else {
      //     callback(null, docs); //成功，返回查询的标签文档信息
      //   }
      //   db.close();
      // });


    });
};

Post.reprint = function(reprint_from,reprint_to,callback){
    // /*
        MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
             assert.equal(err,null);
             const dbs = db.db(settings.db);
             var tbl = dbs.collection(settings.table2);   

          var query = { "postAuthorName": reprint_from.postAuthorName, "time.day": reprint_from.day, "postTitle": reprint_from.postTitle};
             tbl.find(query).toArray(function(error, docs) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  ///xxxxx//////////////////////////////
                  // console.log(docs);
                   var date = new Date();
                   var time = {
                       date: date,
                       year: date.getFullYear(),
                       month: date.getFullYear() + "-" + (date.getMonth() + 1),
                       day: date.getFullYear() + "-" + (date.getMonth() + 1)+ "-" + (date.getDate()),
                       minute: date.getFullYear() + "-" + (date.getMonth() + 1)+ "-" + date.getDate() +  
                       " " + date.getHours() + ":" + (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
                    }

                    delete docs[0]._id; //删除原来的_id
                    docs[0].postAuthorName = reprint_to.postAuthorName;
                    docs[0].head = reprint_to.head;
                    docs[0].time = time;
                    docs[0].postTitle = (docs[0].postTitle.search(/[转载]/) > -1) ? docs[0].postTitle : "[转载]" + docs[0].postTitle;
                    docs[0].comments = [];
                    docs[0].reprint_info ={"reprint_from": reprint_from};
                    docs[0].pv = 0;

                   tbl.updateOne(query,{$push:{"reprint_info.reprint_to":{"postAuthorName":docs[0].postAuthorName,"day":time.day,"postTitle":docs[0].postTitle}}},function(err){
                       db.close();
                       if(error){
                          return callback(error);
                       }   
                    });

                    tbl.insertOne(docs[0],{safe: true},function(err,post){
                       db.close();
                       if(error){
                          return callback(error);
                       }   
                       console.log(docs[0]);
                       callback(null,docs[0]); //成功
                    });
                   ///xxxxx//////////////////////////////////////
                 }
             });   
        });    
     //   */    
};


module.exports = Post;
