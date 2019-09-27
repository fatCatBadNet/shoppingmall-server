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
    res.json(
      new ErrorModel('登录失败')
    )
  })
})

router.get('/test', (req, res, next) => {
  const {
    keyword
  } = req.query;
  // 访问页面
  const superagent = require('superagent');
  const search = encodeURIComponent(keyword);
  superagent.get('https://www.louisvuitton.cn/zhs-cn/search/' + search).retry(3).end((err, data) => {
    if (err) {
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
        let news = {
          title: $(ele).find('.productName').text(),
          price: $(ele).find('.productPrice span').attr('data-htmlcontent')
          // price:$(ele).find('.productPrice span').html()
        };
        hostNews.push(news);
      })
      res.send(hostNews)
    }
  })
})

router.get('/news', (req, res, next) => {
  const {
    keyword
  } = req.query;
  // 访问页面
  const superagent = require('superagent');
  const search = encodeURIComponent(keyword);
  superagent.get('https://www.baidu.com/s?tn=news&rtt=1&bsst=1&wd=%E4%BB%A3%E8%B4%AD&cl=2&origin=ps').set({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
  }).retry(3).end((err, data) => {
    if (err) {
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
          url: $(ele).find('.c-title a').attr('href')
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
router.get('/discount', (req, res, next) => {
  const {
    search,
    model_type
  } = req.query;
  const place = req.query.place || 'cash_model';
  let MGSql;
  let normalSql;
  let MGList;
  let normalList;
  let getWaitingList = [];
  // 购买模式
  // mg模式适用于任何购买地点 普通模式只适用于购买非机场的地点
  switch (model_type) {
    // all对比模式；排除place判断，place全部默认为非机场模式，两段并行查询
    case 'all':
      normalSql = `SELECT * FROM normal_model WHERE 1=1 AND  CN_brand LIKE "%${search}%" OR CN_brand = "所有商品"`;
      MGSql = getMgSql(place, search);
      normalList = searchNormalList(normalSql).then(res => {
        return res;
      });
      MGList = searchInMGList(MGSql, place).then(res => {
        const data = res.map(goods => {
          goods.placeDiscountList = goods.placeDiscountList.map(discount => {
            discount.key = discount.key + `（MG）`;
            return discount;
          })
          return goods;
        })
        return data;
      })
      getWaitingList.push(normalList,MGList);
      break;
    case 'mg':
      MGSql = getMgSql(place, search);
      MGList = searchInMGList(MGSql, place).then(res => {
        return res;
      })
      getWaitingList.push(MGList);
      break;
    case 'normal':
      normalSql = `SELECT * FROM normal_model WHERE 1=1 AND  CN_brand LIKE "%${search}%" OR CN_brand = "所有商品"`;
      normalList = searchNormalList(normalSql).then(res => {
        return res;
      });
      getWaitingList.push(normalList);
      break;
    default:
      break;
  }
  Promise.all(getWaitingList).then(data => {
    const newData = data.length === 1 ? data[0] : [...data[0],...data[1]];
    const type = data.length === 1 ? 'singer' : 'pk';
    res.json(new SuccessModel({
      list: newData,
      type: type
    }))
  })
})
router.get('/rates', (req, res, next) => {
  const sql = `SELECT * FROM rates WHERE 1=1`
  exec(sql).then(data => {
    res.json(new SuccessModel({
      list: data
    }))
  })
})

const searchInMGList = (sql, place) => {
  return exec(sql).then(data => {
    let _data = data;
    if (place === 'all') {
      _data = _data.map(model => {
        let newModel = Object.assign({}, model.cash_model);
        let airModel = Object.assign({}, model.cash_airport_model);
        const airPlaceList = JSON.parse(airModel.place_list);
        const airPlaceDiscountList = JSON.parse(airModel.place_discount_list);
        newModel.placeList = JSON.parse(newModel.place_list);
        newModel.placeDiscountList = JSON.parse(newModel.place_discount_list);
        newModel.placeList.push(...airPlaceList);
        newModel.placeDiscountList.push(...airPlaceDiscountList);
        newModel.placeDiscountList.sort((obj1, obj2) => {
          obj1.value = obj1.value || 0;
          obj2.value = obj2.value || 0;
          return obj1.value < obj2.value;
        })
        delete newModel.place_list;
        delete newModel.place_discount_list;
        return newModel;
      })
    } else {
      _data = _data.map(item => {
        item.placeList = JSON.parse(item.place_list);
        item.placeDiscountList = JSON.parse(item.place_discount_list);
        delete item.place_list;
        delete item.place_discount_list;
        return item;
      })
    }
    return _data;
    //  res.json(new SuccessModel({
    //     list:newData
    //  }))
  })
}

const searchNormalList = (sql) => {
  return exec(sql).then(data => {
    let newData;
    if (data && data.length === 1) {
      newData = data.map(item => {
        item.placeList = JSON.parse(item.place_list);
        item.placeDiscountList = JSON.parse(item.place_discount_list).map(discount => {
          discount.key = discount.key + `（普通/标准）`;
          return discount;
        })
        delete item.place_list;
        delete item.place_discount_list;
        return item;
      })
    } else if (data && data.length >= 2) {
      const normalDiscountList = JSON.parse(data.find(goods => goods.EN_brand === '所有商品').place_discount_list);
      newData = data.filter(goods => goods.EN_brand !== '所有商品').map(goods => {
        const placeDiscountList = [];
        goods.EN_brand = goods.EN_brand === 'undefined' ? goods.CN_brand : goods.EN_brand;
        goods.placeList = JSON.parse(goods.place_list);
        goods.placeDiscountList = JSON.parse(goods.place_discount_list);
        for (let index = 0; index < normalDiscountList.length; index++) {
          const normalDiscount = normalDiscountList[index];
          const newDiscount = {};
          const needEspecialDiscount = goods.placeDiscountList.find(_discount => _discount.key === normalDiscount.key);
          newDiscount.key = needEspecialDiscount ? needEspecialDiscount.key + `（普通/特例）` : normalDiscount.key + `（普通/标准）`;
          newDiscount.value = needEspecialDiscount ? needEspecialDiscount.value : normalDiscount.value;
          placeDiscountList.push(newDiscount);
        }
        goods.placeDiscountList = placeDiscountList;
        goods.placeDiscountList.sort((obj1, obj2) => {
          obj1.value = obj1.value || 0;
          obj2.value = obj2.value || 0;
          return obj1.value < obj2.value;
        })
        delete goods.place_list;
        delete goods.place_discount_list;
        return goods;
      })
    } else {
      newData = [];
    }
    return newData;
  })
}
const getMgSql = (place, search) => {
  let sql;
  if (place === 'all') {
    // const _sql = `SELECT * FROM cash_airport_model LEFT JOIN cash_model ON cash_model.CN_brand=cash_airport_model.CN_brand
    // WHERE 1=1 AND CONCAT(cash_airport_model.CN_brand,cash_model.CN_brand) LIKE "%${search}%"`;
    const _sql = `SELECT * FROM cash_model,cash_airport_model WHERE cash_model.CN_brand=cash_airport_model.CN_brand 
    AND CONCAT(cash_airport_model.CN_brand,cash_model.CN_brand) LIKE "%${search}%"`
    sql = {};
    sql.sql = _sql;
    sql.nestTables = true;
  } else {
    sql = `SELECT * FROM ${place} WHERE 1=1 AND CN_brand LIKE "%${search}%"`
  }
  return sql;
}
module.exports = router;