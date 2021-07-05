var express = require('express');
var router = express.Router();//路由
//crypto是Node.js的一个加密模块，用它生成散列值来加密密码
var crypto = require('crypto');
var fs = require('fs');
const multer = require('multer');//multer上传文件
var image = require("imageinfo");
var path = require('path');
const PUBLIC_PATH = path.resolve(__dirname, '../public/images/');//从后向前，若字符以 / 开头，不会拼接到前面的路径；若以 ../ 开头，拼接前面的路径，且不含最后一节路径；若以 ./ 开头 或者没有符号 则拼接前面路径
var passport = require('passport');

var User = require('../models/user.js');//三个collection操作
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');

//中间件
/////////////////////////////////////////////////////////////
//上传文件设置
var createFolder = function(folder){
    try{
        fs.accessSync(folder); //判断文件夹是否存在，不存在就创建
    }catch(e){
        fs.mkdirSync(folder);
    }  
};
//var uploadFolder = './public/images/';
createFolder(PUBLIC_PATH);//创建文件夹

// 通过 filename 属性定制
//设定存储路径和命名
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PUBLIC_PATH);    // 保存的路径，需要自己创建文件夹
    },
    filename: function (req, file, cb) {
    	var fileFormat = (file.originalname).split(".");
        // 保存文件名为 字段名 + 时间戳，比如 logo-1478521468943
        cb(null, file.fieldname + '-' + Date.now()+ "." + fileFormat[fileFormat.length - 1]);	 
    }
});

// 上传
var upload = multer({ storage: storage,limits:{ // 设定限制，每次最多上传5个文件，文件大小不超过20MB
                                         fileSize: 20000000, 
                                         files:5
                                       }
    });

//读取文件
function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = path;//路径
            obj.filename = itm//名字
            filesList.push(obj);
        }

    });

}

var getFiles = {
   //获取文件夹下的所有文件
    getFileList: function (path) {
        var filesList = [];
        readFileList(path, filesList);
        return filesList;
    },
    //获取文件夹下的所有图片
    getImageFiles: function (path) {
        var imageList = [];

        this.getFileList(path).forEach((item) => {
            var ms = image(fs.readFileSync(item.path + item.filename));

            ms.mimeType && (imageList.push(item.filename))
        });
        return imageList;

    },    
    //获取文件夹下所有非图片的文件 
    getTxtList: function (path) {
        return this.getFileList(path).filter((item) => {
            var ms = image(fs.readFileSync(item.path + item.filename));
            return !ms.mimeType
        });
    }
};

/*
//获取文件夹下的所有图片
getFiles.getImageFiles(PUBLIC_PATH);   //"./public/images/"
//获取文件夹下的所有文件
getFiles.getFileList("./public/images/");

 */


/////////////////////////////////////////////////////////////////////
//登录检查
function checkLogin(req,res,next){
	if (!req.session.user){
		req.flash('error','未登录！');
		res.redirect('/login');
	}
	next();
}

function checkNotLogin(req,res,next){
	if (req.session.user){
		req.flash('error','已登录！');
		res.redirect('back');
	}
	next();
}


///////////////////////////////////////////////////////////////////////////////
/* GET home page. */
router.get('/', function(req, res) {
	var page = req.query.p?parseInt(req.query.p) :1;
	var postArr = [];
	Post.getTenPosts(null,page,function(err,posts,total){
         if(err){
         	posts = [];
         }else{
        	//console.log(posts);
            postArr = posts;
           // console.log(arrpost);
         }
         //////
         res.render('index', { title: '主页',
  	                    user:req.session.user,
			            posts: postArr,
  	                    page:page,
  	                    isFirstPage:(page - 1) == 0,
  	                    isLastPage:((page - 1) *10 + posts.length) == total,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	});

    //测试用
	// res.render('reg', {
	// 	title: '注册',
	// 	user: req.session.user,
	// 	success: req.flash('success').toString(),
	// 	error: req.flash('error').toString()
	// })


});


router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
   res.render('reg', { title: '注册',
  	                    user:req.session.user,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
   });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res) {//注册
	var name = req.body.name,password = req.body.password,password_re =req.body['password-repeat'];
	if (password_re != password){
		req.flash('error','两次输入的密码不一致');
		return res.redirect('/reg');		
	}

	var md5 = crypto.createHash('md5'), password = md5.update(req.body.password).digest('hex');// digest 方法参数用于指定加密后的返回值的格式（hex十六进制）
	var userREC = {name:req.body.name,password:password,email:req.body.email};
	var newUser = new User(userREC);//构造函数，给新的记录赋值
	User.findUser(newUser.name,function(err,user){		
		if(user){
           if (user.length > 0){
			    // console.log(user);
			    req.flash('error','用户已存在！');
			    return res.redirect('/reg');
	  	   } else{
			    if(newUser.email==null||newUser.password==null){
					req.flash('error', '密码和邮箱均不能为空，请输入');
					return res.redirect('/reg');
				}
			    newUser.createUser(function(err,user){
		          if(err){
			         req.flash('error',err);
			         return res.redirect('/reg');
		          }else{
		           	 console.log(user[0]) ;
   		             req.session.user = user[0];
   		           //  console.log('注册成功！') ;
		             req.flash('success','注册成功！');
		             res.redirect('/');
 	    	      }
	            });
			   //////////////
           }
		}
	});

});

router.get('/login', checkNotLogin);
router.get('/login', function(req, res) {
  res.render('login', { title: '登录',
  	                    user:req.session.user,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
   });
});

router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
//	/*
	var md5 = crypto.createHash('md5'),password = md5.update(req.body.password).digest('hex');
	User.findUser(req.body.name,function(err,user){
		if(user){
		   //	console.log(user[0]) ;
            if (user.length > 0){
           	  //////////
		      if (user[0].password != password){
			    req.flash('error','密码错误！');
			    return res.redirect('/login');	     	
		      }else{
		     	req.session.user = user[0];
		        req.flash('success','登录成功！');
		        res.redirect('/');
		      }
		      ///////////
            }else{
			    req.flash('error','用户不存在！');
			    return res.redirect('/login');
            }
		}
	});
//	*/
});

router.get('/createPost', checkLogin);
router.get('/createPost', function(req, res) {
	res.render('createPost', { title: '发表',
  	                    user:req.session.user,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
   });
});

router.post('/createPost', checkLogin);
router.post('/createPost', function(req, res) {
	var currentUser = req.session.user;
	//console.log(currentUser);
	var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
	var post= new Post(currentUser.name,currentUser.head,req.body.title,req.body.content,tags);
	//检查是否标题重复（这里有个特点就是文章数为0时会报错，而且有重复文章时也会报错）

	//现在是不注释这一段可以检测重复，checkTitle方法应该没问题。但是else出问题
	Post.checkTitle(req.body.title,function (error,postRes) {

		if (postRes){//注意括号范围！！！（else缩进不知道怎么到if(postRes外了)

			if (postRes.length > 0){
				req.flash('error','标题不能重复！');
				return res.redirect('/createPost');
			}
			else {
				post.createPost(function (err) {
					if (err) {
						req.flash('error', err);
						return res.redirect('/');
					} else {
						req.flash('success', '发表成功！');
						res.redirect('/');
					}
				});
			}
		}


	});

	// post.createPost(function(err){
    //     if(err){
	// 		    req.flash('error',err);
	// 		    return res.redirect('/');
    //     }else{
	// 	        req.flash('success','发表成功！');
	// 	        res.redirect('/');        	
    //     }
	// });

});

router.get('/logout', checkLogin);
router.get('/logout', function(req, res) {
//	/*
         	req.session.user = null;
	        req.flash('success','登出成功！');
	        res.redirect('/');
//	*/        
});


router.get('/upload', checkLogin);
router.get('/upload', function(req, res) {
  res.render('upload', { title: '文件上传',
  	                    user:req.session.user,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
   });
});


router.post('/upload', checkLogin);
router.post('/upload', upload.array('files', 5),function(req, res) {
  	console.log(req.files); 
    for (var i in req.files){
    	if (req.files[i].size == 0){
             fs.unlinkSync(req.files[i].path);
             console.log('成功移除一个空文件！');
    	}else{
    	//	var target_path = './public/images/'+req.files[i].originalname;
    	//	fs.renameSync(req.files[i].path,target_path);
             console.log(req.files[i].filename);
    	}
    }
    req.flash('success','文件上传成功！');
    res.redirect('/upload');


});

//路由规则：用来处理访问用户页请求
router.get('/u/:name', function(req, res) {
   var page = req.query.p?parseInt(req.query.p) :1;
	User.findUser(req.params.name,function(err,user){
		if(user){
           if (user.length > 0){
           	  //////////
  	            Post.getTenPosts(user[0].name,page,function(err,posts,total){
                     if(err){
			              req.flash('error',err);
			               return res.redirect('/');                     
                     }
                     //////
                     res.render('user', { title: user.name,
  	                    user:req.session.user,
  	                    posts:posts,
  	                    page:page,
  	                    isFirstPage:(page - 1) == 0,
  	                    isLastPage:((page - 1) *10 + posts.length) == total,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
                     });
	            });
		      ///////////
		    }else{
			    req.flash('error','用户不存在！');
			    return res.redirect('/');
            }
		}
   });
});

//路由规则：用来处理访问文章页请求
router.get('/u/:name/:day/:title', function(req, res) {
              	  //////////
	Post.getOnePost(req.params.name, req.params.day, req.params.title,function(err,post){
                     if(err){
			              req.flash('error',err);
			               return res.redirect('/');                     
                     }
                     //////
                     res.render('postManage', { title: req.params.title,
  	                    user:req.session.user,
  	                    post:post,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
                     });
	            });
});

router.post('/u/:name/:day/:title', function(req, res) {
   var date = new Date();
   var time = date.getFullYear() + "-" + (date.getMonth() + 1)+ "-" + date.getDate() + " " + 
              date.getHours() + ":" + (date.getMinutes()<10?'0'+
              date.getMinutes():date.getMinutes());

   var md5 = crypto.createHash('md5'),
       email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
	   head = "https://sdn.geekzu.org/avatar/" + email_MD5 + "?s=36";//根据邮箱获取Gravatar头像，s是大小

   var comment ={//这里是创建新评论（也要修改下）
   	  name: req.body.name,
   	  head: head,
   	  email: req.body.email,
   	  website: req.body.website,
   	  time: time,
   	  content: req.body.content,
	  postTitleOfComment: req.params.title
   }

	var newComment = new Comment(req.params.name, req.params.day, req.params.title,comment);

    
	newComment.createComment(function (err, post) {
		if (err) {
			req.flash('error', err);
			return res.redirect('back');
		} else {
			req.flash('success', '评论成功！');
			return res.redirect('back');//因为多次响应，所以加上return试试
		}
	});
    
});

//路由规则：用来处理编辑文章页请求
router.get('/editPost/:name/:day/:title', checkLogin);
router.get('/editPost/:name/:day/:title', function(req, res) {
              	  //////////
            	var currentUser = req.session.user;
	            Post.editPost(currentUser.name, req.params.day, req.params.title,function(err,post){
                     if(err){
			              req.flash('error',err);
			               return res.redirect('back');                     
                     }
                     //////
                     res.render('editPost', { title: '编辑',
  	                    user:req.session.user,
  	                    post:post,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
                     });
	            });
});

//路由规则：用来提交编辑文章页
router.post('/editPost/:name/:day/:title', checkLogin);
router.post('/editPost/:name/:day/:title', function(req, res) {
              	  //////////
            	var currentUser = req.session.user;
	            Post.update(currentUser.name, req.params.day, req.params.title,req.body.postContent,function(err){
					var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title + '/';
                     if(err){
			              req.flash('error',err);
			               return res.redirect(url);                     
                     }else{
			              req.flash('success','文章修改成功！');
			              res.redirect(url);                     
                     }
	            });
});

//路由规则：用来处理删除文章页请求
router.get('/removePost/:name/:day/:title', checkLogin);
router.get('/removePost/:name/:day/:title', function(req, res) {
              	  //////////
            	var currentUser = req.session.user;

	            Post.removePost(currentUser.name, req.params.day, req.params.title, function (err, post) {
					if (err) {
						req.flash('error', err);
						return res.redirect('back');
					} else {
						req.flash('success', '文章删除成功！');
						res.redirect('/');
					}
				});


});

router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function(req, res) {
	
              	  //////////
				
	            Post.editPost(req.params.name, req.params.day, req.params.title,function(err,post){
                     if(err){
			              req.flash('error',err);
			               return res.redirect('back');                     
                     }
             	    var currentUser = req.session.user;
					var reprint_from = { postAuthorName: post.postAuthorName, day: post.time.day, postTitle: post.postTitle};
					var reprint_to = { postAuthorName: currentUser.name,head: currentUser.head};
                     //////

  	                 Post.reprint(reprint_from,reprint_to,function(err,post){
                         if(err){
			               req.flash('error',err);
			               return res.redirect('back');                     
                         }else{
			               req.flash('success','转载成功！');
							var url = '/u/' + post.postAuthorName + '/' + post.time.day + '/' + post.postTitle;
			               res.redirect(url);         //跳转失败            
                         }
                      
                    });
	          });


});

router.get('/archive', function(req, res) {
	Post.getArchive(function(err,posts){
         if(err){
             req.flash('error',err);
             return res.redirect('/');                     
         }                        
         res.render('archive', { title: '档案',
  	                    user:req.session.user,
  	                    posts:posts,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	});
});

router.get('/tags', function(req, res) {
	Post.getTags(function(err,posts){
         if(err){
             req.flash('error',err);
             return res.redirect('/');                     
         }                        
         res.render('tags', { title: '标签列表',
  	                    user:req.session.user,
  	                    posts:posts,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	});
});


router.get('/tags/:tag', function(req, res) {
	Post.getTag(req.params.tag,function(err,posts){
         if(err){
             req.flash('error',err);
             return res.redirect('/');                     
         }
		 
         res.render('tag', { title: 'TAG:' + req.params.tag,
  	                    user:req.session.user,
  	                    posts:posts,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	});
});

router.get('/searchByTitle', function(req, res) {
	Post.search(req.query.keyword,function(err,posts){
         if(err){
             req.flash('error',err);
             return res.redirect('/');                     
         }                        
         res.render('searchByTitle', { title: '标题包括:' + req.query.keyword+'的搜索结果',
  	                    user:req.session.user,
  	                    posts:posts,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	});
});


router.get('/searchPostByCommentUserName',function (req, res) {
	Comment.searchPostByCommentUserName(req.query.keyword2, function(err, posts){
		if(err){//一直在err状态
			req.flash('error', err);
			return res.redirect('/');
		}

		// let i = 0;
        // let postSearchRes;
		// for (i = 0; i < posts.length; i++)//这里的length就有问题了
		// {
		// 	if (posts[i].posts.length != 0 && posts[i].posts[0].postAuthorName == req.query.keyword2){
		// 		postSearchRes=posts[i].posts;

		// 	}

		// }
		res.render('searchPostByCommentUserName', {
			title: '评论者:' + req.query.keyword2 + '的文章搜索结果',
			user: req.session.user,
			posts: posts,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});

	});
	
});

router.get('/links', function(req, res) {
	//////////                     
         res.render('links', { title: '学习链接',
  	                    user:req.session.user,
  	                    success:req.flash('success').toString(),
  	                    error:req.flash('error').toString()
         });
	////////////////
});

router.get('/login/github', passport.authenticate("github",{session:false}));
router.get('/login/github/callback', passport.authenticate("github",{
    session:false,
    failureRedirect: '/login',
    successFlash: '登录成功！'  
  },function(req,res){
	req.session.user = { name: req.user.username, head: "https://sdn.geekzu.org/avatar/" + req.user._json.gravatar_id + "?s=36" };
          res.redirect('/');
}));

module.exports = router;
/*
module.exports = function(app) {
   app.get('/', function(req, res,) {
       res.render('index', { title: 'Express' });
   });
}
*/