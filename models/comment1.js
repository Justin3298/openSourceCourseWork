var settings = require('../settings');
var MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
/////////////////////////////////

// 字段为name,
function Comment(name,day,title,comment) {
   this.name = name;
   this.title = title;
   this.day = day;
   this.comment = comment;
 } 

///////////////////////////////////////存储评论信息/////////////////
Comment.prototype.createComment = function(callback){
   var  name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;

      MongoClient.connect(settings.url,{useNewUrlParser:true},function(err, db) {
            //  assert.equal(err,null);
             const dbs = db.db(settings.db);//24-34是原来的操作（查找对应的post，把这条评论插入post）
             var tbl = dbs.collection(settings.table2);  

             var query = {"postAuthorName":name,"time.day":day,"postTitle":title};
             tbl.update(query,{$push:{"comments":comment}},function(error) {
                 if(error){
                   db.close();
                   return callback(error);
                 }else{
                  //  callback(null); //成功（在这里把另一段嵌套进去）

                   var tb3 = dbs.collection(settings.table3);
                   tb3.insertOne(comment, function (error, result) {
                     if (error) {
                       db.close();
                       return callback(error);
                     } else {
                       callback(null); //成功
                     }
                     db.close();
                   });

                 }
                //  db.close();//关闭放在最后
             });  
//----------------------------------------------            
            // var tb3 = dbs.collection(settings.table3);//建议看看其他文件再写
            // tb3.insertOne(comment, function (error, result) {
            //     if (error) {
            //       db.close();
            //     return callback(error);
            //     } else {
            //     callback(null); //成功
            //     }
            //     db.close();
            // });
//-----------------------------
            
      });


};

//可能还有其他参数
Comment.searchPostByCommentUserName =function(keyword,callback) {
    MongoClient.connect(settings.url, { useNewUrlParser: true }, function (err, db) {
        assert.equal(err, null);
        const dbs = db.db(settings.db);
        var tb1 = dbs.collection(settings.table2);
        var tb2 = dbs.collection(settings.table3);

        tb2.aggregate([//这里出问题
          // {
          //   $match:{
          //     postAuthorName:keyword
          //   }
          // },
          {
            $lookup: {
              from: tb1,
              localField: "name",
              foreignField: "postAuthorName",
              as: "posts"
            }
          },
          {
            $project:{
              postTitle:1,
              posts:1
            }
          }
            ]).toArray(function(error, docs){
              // // if(error){
              // //   db.close();
              // //   return callback(error);
              // // } else 
              // {
              //   let i=0;
              //   docs=docs.toArray()
              //   for(i=0;i<docs.length;i++)//这里的length就有问题了
              //   {
              //     if(docs[i].posts.length!=0&&docs[i].posts[0].postAuthorName==keyword){
              //     return callback(null, docs[i].posts);//不知道两个callback会不会有问题....
              //     }
              //   }
              //   callback(null, docs); //成功，返回查询的标签文档信息
              // }
              // db.close();
              
              
            });
      });
  
};


module.exports = Comment;
