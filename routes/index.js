var express = require('express')
var jwt = require('jsonwebtoken')
var router = express.Router();
const {
  exec
} = require('../db/index')
const {
  SuccessModel,
  ErrorModel
} = require('../model/model')
const secretOrPrivateKey = 'mengqishopping';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

//登录
router.post('/login_in', function (req, res, next) {
  const {
    username,
    password
  } = req.body;
  // 是否合法
  if (Object.prototype.toString.call(username) !== '[object String]' || username === '') {
    res.json(new ErrorModel(
      '用户姓名格式错误！'
    ))
  }
  if (Object.prototype.toString.call(password) !== '[object String]' || password === '') {
    res.json(new ErrorModel(
      '用户密码格式错误！'
    ))
  }
  const sql = `SELECT * FROM admin WHERE username="${username}" AND password="${password}"`;
  exec(sql).then(data => {
    if (data.length === 0) {
      res.json(
        new ErrorModel('登录失败')
      )
      return;
    }
    // 生成token
    let content = {
      name: username,
      password: password
    };
    let token = jwt.sign(content, secretOrPrivateKey, {
      expiresIn: 24 * 60 * 60 * 1 //秒单位，24小时后过期
    })
    res.json(new SuccessModel({
      token: token
    }))
  }).catch(err => {
    console.log(err);
    res.json(
      new ErrorModel('登录失败')
    )
  })
})

router.get('/test', (req,res,next)=>{
  const {keyword} = req.query;
  // 访问页面
  const superagent = require('superagent');
  const search = encodeURIComponent(keyword);
  superagent.get('https://www.louisvuitton.cn/zhs-cn/search/'+search).retry(3).end((err, data) => {
      if(err) {
          console.log(`访问页面失败${err}`);
          res.send(`访问页面失败${err}`)
      } else {
        const cheerio = require('cheerio');
        let hostNews = [];
        let $ = cheerio.load(data.text);
        // res.send(data)
        // $('.spice-product-tiles-slot .product-tiles-box > a .spice-item-grid-info').each((idx, ele) => {
        //     let news = {
        //         title: $(ele).children('h2').text(),
        //         price:$(ele).find('p').eq(1).text()
        //     };
        //     hostNews.push(news);
        // })
        // LV价格搜索
        $('.productItem .productInfo').each((idx, ele) => {
          console.log($(ele).find('.productPrice span').data('htmlContent'));
            let news = {
                title: $(ele).find('.productName').text(),
                price:$(ele).find('.productPrice span').attr('data-htmlcontent')
                // price:$(ele).find('.productPrice span').html()
            };
            hostNews.push(news);
        })
        res.send(hostNews)
      }
  })
})

router.get('/news', (req,res,next)=>{
  const {keyword} = req.query;
  // 访问页面
  const superagent = require('superagent');
  const search = encodeURIComponent(keyword);
  superagent.get('https://www.baidu.com/s?tn=news&rtt=1&bsst=1&wd=%E4%BB%A3%E8%B4%AD&cl=2&origin=ps').set({
    'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
  }).retry(3).end((err, data) => {
  if(err) {
          console.log(`访问页面失败${err}`);
          res.send(`访问页面失败${err}`)
      } else {
        const cheerio = require('cheerio');
        let hostNews = [];
        let $ = cheerio.load(data.text);
        // res.send(data)
        // $('.spice-product-tiles-slot .product-tiles-box > a .spice-item-grid-info').each((idx, ele) => {
        //     let news = {
        //         title: $(ele).children('h2').text(),
        //         price:$(ele).find('p').eq(1).text()
        //     };
        //     hostNews.push(news);
        // })
        // LV价格搜索
        $('#container .result').each((idx, ele) => {
            let news = {
                title: $(ele).find('.c-title a').text(),
                url:$(ele).find('.c-title a').attr('href')
                // price:$(ele).find('.productPrice span').attr('data-htmlcontent')
                // price:$(ele).find('.productPrice span').html()
            };
            hostNews.push(news);
        })
        res.send(hostNews)
      }
  })
})
// 价格查询
router.get('/discount',(req,res,next)=>{
  const {search} = req.query;
  const sql = `SELECT * FROM cash_model WHERE 1=1 AND CN_brand LIKE "%${search}%"`
  exec(sql).then(data =>{
    const newData = data.map(item =>{
      item.placeList = JSON.parse(item.place_list);
      item.placeDiscountList = JSON.parse(item.place_discount_list);
      delete item.place_list;
      delete item.place_discount_list;
      return item;
    })
     res.json(new SuccessModel({
        list:newData
     }))
  })
})
router.get('/rates',(req,res,next)=>{
  const sql = `SELECT * FROM rates WHERE 1=1`
  exec(sql).then(data =>{
     res.json(new SuccessModel({
        list:data
     }))
  })
})
module.exports = router;