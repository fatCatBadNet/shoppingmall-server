var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const xlsx = require('xlsx');
const schedule = require("node-schedule");
// 品牌分类
const brandList = require('./routes/brand/brand')
// 商品
const bag = require('./routes/goods/bag/index');
// const bag = require('./routes/goods/bag/bag');
// const bag = require('./routes/goods/bag/bag');
const goods = require('./routes/goods/index');
const banner = require('./routes/activity/banner');
var jwt = require('jsonwebtoken')

const {
  exec
} = require('./db/index')
const {
  scheduleList
} = require('./schedule/index')


let excel = xlsx.readFile('./static/normalmodel.xlsx');
let SheetNames = excel.SheetNames; //表名
let sheet = excel.Sheets[SheetNames[0]]; //第一个表的数据具体对象
xlsx.utils.sheet_to_json(sheet).map((row, index) => {
  let ENbrand, CNbrand, type, placeList, placeDiscountList;
  placeList = [];
  placeDiscountList = [];
  type='normal';
  for (const key in row) {
    if (key === '类别') {
      type = row[key];
    } else if (key === '名称') {
      CNbrand = row[key];
    } else if (key === '品牌') {
      ENbrand = row[key];
    } else if(key !== '分类') {
      placeList.push(key);
      let obj = {
        key: key,
        value: row[key]
      };
      placeDiscountList.push(obj);
    }
  }
  placeList = JSON.stringify(placeList);
  placeDiscountList = JSON.stringify(placeDiscountList);
  const sql = `INSERT INTO normal_model (EN_brand,CN_brand,type,place_list,place_discount_list) 
  VALUES ("${ENbrand}","${CNbrand}","${type}",'${placeList}','${placeDiscountList}')`;
  // exec(sql).then(data =>{
  //   // console.log(data);
  // })
})

const {
  SuccessModel,
  ErrorModel
} = require('./model/model')

// 秘钥
const secretOrPrivateKey = 'mengqishopping';

var app = express();
//解决跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With,headers');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (req.method == 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
// 登录监测
// app.use()
app.use('/users', usersRouter);
app.use('/api/goods/bag', bag);
app.use('/api/goods', brandList);
app.use('/api/goods', goods);
app.use('/api/banner', banner);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 定时任务
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 8;
rule.minute = 0;
schedule.scheduleJob(rule, function () {
  scheduleList();
});
module.exports = app;