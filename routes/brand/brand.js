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
router.get('/brand_list',middleware, (req, res, next) => {
    // const {currentPage,pageSize} = req.query;
    const query = req.query;
    const currentPage = query.currentPage || 1;
    const pageSize = query.pageSize|| 10;
    const name = query.name || '';
    const type = query.type || '';
    const getAll = query.getAll || false;
    // 分页查询条件
    let sql = `SELECT * FROM brand WHERE 1=1 
    ${name ? `AND name LIKE '%${name}%'`:''} 
    ${type ? `AND type LIKE '%${type}%'`:''}
    ORDER BY id DESC `;
    sql = getAll ? sql : sql + `LIMIT ${(currentPage-1)*pageSize},${pageSize}`;
     //总数
    const sqlTotal = `
    SELECT COUNT(*) FROM brand WHERE 1=1
    ${name ? `AND name LIKE '%${name}%'`:''}
    ${type ? `AND type LIKE '%${type}%'`:''}
    `;    //表中总数
    exec(sql).then(brands => {
        if(getAll){
            res.json(new SuccessModel({
                list:brands
            }))
            return;
        }
        exec(sqlTotal).then(totalData =>{
            res.json(new SuccessModel({
                list: brands,
                pagination:{
                    current:Number(currentPage),
                    pagination:Number(pageSize),
                    total:totalData[0]['COUNT(*)']
                }
            }))
        })
    })
})
// 录入包品牌
router.post('/brand',middleware,(req,res)=>{
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
router.post('/brand/delete',middleware, (req, res) => {
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