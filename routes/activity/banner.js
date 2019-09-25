const express = require('express')
const {
    exec
} = require('../../db/index')
const {
    SuccessModel,
    ErrorModel
} = require('../../model/model')
const router = express.Router();
const multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');

// 验证中间件
const middleware = (req, res, next) => {
    const secretOrPrivateKey = 'mengqishopping';
    const {
      token
    } = req.headers;
    if(token === '' || !token){
      res.status(401).json(new ErrorModel('没有token参数！'));
      return;
    }
    jwt.verify(token, secretOrPrivateKey, (err, decode) => {  
      if (err) { //失效  或者 伪造token
        res.json(new ErrorModel('token失效！'));
        return;
      } else {
        next()
      }
    })
  }
// 查询品牌
router.get('/list',middleware, (req, res, next) => {
     res.json(new SuccessModel({
         list:[{
            activeUser: 116398,
            avatar: "https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png",
            content: "段落示意：蚂蚁金服设计平台 ant.design，用最小的工作量，无缝接入蚂蚁金服生态，提供跨越设计与开发的体验解决方案。蚂蚁金服设计平台 ant.design，用最小的工作量，无缝接入蚂蚁金服生态，提供跨越设计与开发的体验解决方案。",
            cover: "https://gw.alipayobjects.com/zos/rmsportal/uMfMFlvUuceEyPpotzlq.png",
            createdAt: "2019-09-12T03:23:16.252Z",
            description: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。",
            href: "https://ant.design",
            id: "fake-list-0",
            like: 125,
            logo: "https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png",
            members: [],
            message: 14,
            newUser: 1310,
            owner: "付小小",
            percent: 54,
            star: 132,
            status: "active",
            subDescription: "那是一种内在的东西， 他们到达不了，也无法触及的",
            title: "Alipay",
            updatedAt: "2019-09-12T03:23:16.252Z"
         }]
     }))
})
// 录入包品牌
router.post('/',middleware,(req,res)=>{
    let {
        name,
        type
    } = req.body;
    let sql = `INSERT INTO brand (name,type) VALUES ('${name}','${type.join(',')}')`;
    if(type && type.length !== 0){
        exec(sql).then(data => {
            res.json(new SuccessModel({
                id: data.insertId,
                message: '创建成功！'
            }));
        }) 
    }else{
        res.json(new ErrorModel({
            message:'创建失败！'
        }))
    }
})

// 删除
router.delete('/:id',middleware, (req, res) => {
    const {
        idList
    } = req.body;
    // DELETE FROM  bag WHERE id IN (${idListString})
    const sql = `
    DELETE FROM brand WHERE id IN (${idList.join(',')})
    `;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            message: '删除成功！'
        }));
    })
})
module.exports = router;