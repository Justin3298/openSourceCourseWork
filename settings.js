///*
module.exports = {
   cookieSecret:'myblog',  //用于Cookie加密，留作后用，与数据库 无关
   port:27017,
   table:'userCollection',//collection1,user
   table2:'postCollection',//collection2，在post和comment中，尝试修改分成两个，或者多一个tag
   table3:'commentCollection',//尝试comment分离出单独表
   // db:'nodestudy',//数据库名
   db:'blogManageSys',
   host:'localhost',
   url:'mongodb://localhost:27017'
}
//*/