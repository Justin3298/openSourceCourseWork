var createError = require('http-errors');
var express = require('express');
var path = require('path');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var session = require("express-session");
var MongoStore=require('connect-mongo')(session);   
var flash = require('connect-flash');
var fs = require('fs');
var accesslog =fs.createWriteStream('access.log',{flags:'a'});
var errorlog =fs.createWriteStream('error.log',{flags:'a'});

var settings = require('./settings');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var passport = require('passport'),GithubStrategy = require('passport-github').Strategy;


//body解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
//监听端口
app.set('port',process.env.PORT||3001);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(express.favicon()); //connect内建的中间件，使用默认的favicon图标
//app.use(express.favicon(__dirname + '/public/images/phone.ico')); //connect内建的中间件，使用自己的图标
app.use(flash());
app.use(logger('dev'));  ////打印到控制台
app.use(logger('combined',{stream: accesslog})); //打印到log日志
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(session({
            secret: settings.cookieSecret,  //加密字符串 随便写
            resave: false,  //强制保存session 默认为 true。建议设置成 false
            saveUninitialized: true,  //强制将未初始化的 session 存储 默认为 true。建议设置成true
            rolling:true,
            cookie:{maxAge:1000*60*60*24*30},
            store:new MongoStore({
              url: 'mongodb://localhost:27017/blogManageSys',
                       touchAfter: 24 * 3600 // 通过这样做，设置touchAfter:24 * 3600，您在24小时内只更新一次会话，
                                             //  不管有多少请求(除了在会话数据上更改某些内容的除外)
                  })
}));
//app.use(express.methodOverride());
app.use(passport.initialize());
//添加序列化与反序列化回调
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    UserModel.findById(id, function(err, user) {
        done(err, user);
    })
});
//添加Github鉴权策略
passport.use(new GithubStrategy({
      clientID: '6a015b89a1bb341f9ee4',
      clientSecret: '8a2c17f7eaaea969008573eb0a4f55940ef1c510',
      callbackURL: 'http://localhost:3001/github/oauth/callback'
},function(accessToken,refreshToken,profile,done) {
  UserModel.findOne({
      githubId: profile.id
  }, function(err, user) {
      if (err) {
          return done(err);
      } else {
          if (!user) {
              user = new UserModel({
                githubId:profile.id,
                username:profile.username
              });
              user.save();
              return done(null, user);
          }else{
              return done(null, user);
          }
      }
  });
}));


app.use('/', indexRouter);  
app.use('/users', usersRouter);


app.use(function(req, res) {
  res.render("404");
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  //当错误发生时，将错误保存到根目录error.log
  var meta = '[' + new Date() + ']' + req.url + '\n';
  errorlog.write(meta + err.stack + '\n');

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


//app.get('/',routes.index);  //路由控制器 如果访问/(主页)，则由 routes.index 处理，routes/index.js 
//app.get('/users',user.list);
//routes(app);


http.createServer(app).listen(app.get('port'),function(){ console.log('Express server listening on port '+app.get('port')); });

module.exports = app;
