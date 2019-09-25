const express = require('express')
const {
    exec
} = require('../../../db/index')
const {
    SuccessModel,
    ErrorModel
} = require('../../../model/model')
const router = express.Router();
const multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
// const uploadPath = path.resolve(__dirname, '../../..');
const upload = multer({
    dest: __dirname + '/static/upload/'
}) //设置上传的目录文件夹
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
// 列表
router.get('/bag_list',middleware, (req, res, next) => {
    // const {currentPage,pageSize} = req.query;
    const query = req.query;
    const currentPage = query.currentPage || 1;
    const pageSize = query.pageSize|| 10;
    const name = query.name || '';
    const brand = query.brand || '';
    // 分页查询条件
    let sql = `SELECT * FROM bag WHERE 1=1 AND status=1 
    ${name ? `AND name LIKE '%${name}%'`:''} 
    ${brand ? `AND brand='${brand}'`:''}
    ORDER BY create_time DESC
    LIMIT ${(currentPage-1)*pageSize},${pageSize}`; //查询具体数据
    const sqlTotal = `
    SELECT COUNT(*) FROM bag WHERE status=1 
    ${name ? `AND name LIKE '%${name}%'`:''}
    ${brand ? `AND brand='${brand}'`:''}
    `;    //表中总数
    exec(sql).then(data => {
        const newData = data.map(goods =>{
            goods.detail_img_url = goods.detail_img_url? goods.detail_img_url.split(',') : []; 
            goods.display_img_url = goods.display_img_url? goods.display_img_url.split(',') : [];            
            return goods;
        })
        console.log(newData.length);
        exec(sqlTotal).then(totalData =>{
            res.json(new SuccessModel({
                list: newData,
                pagination:{
                    current:Number(currentPage),
                    pagination:Number(pageSize),
                    total:totalData[0]['COUNT(*)']
                }
            }))
        })
    })
})
// 新增
router.post('/bag',middleware, (req, res, next) => {
    let {
        name,
        brand,
        size,
        stock,
        original_price,
        current_price,
        shelf_status
    } = req.body;
    const createTime = Date.now();
    const sql =
        `INSERT INTO bag 
    (name,brand,size,stock,original_price,current_price,shelf_status,status,create_time)
    VALUES 
    ('${name}','${brand}','${size}',${stock},'${original_price}','${current_price}',${shelf_status},true,'${createTime}')`;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            id: data.insertId,
            message: '创建成功！'
        }));
    })
})
// 删除（支持批量）
router.post('/bag/delete',middleware, (req, res) => {
    const {
        idList
    } = req.body;
    let idListString = '';
    idList.forEach((id, index) => {
        if (index + 1 !== idList.length) {
            idListString = idListString + id + ',';
        } else {
            idListString = idListString + id;
        }
    });
    // DELETE FROM  bag WHERE id IN (${idListString})
    const sql = `
    UPDATE bag SET status=false WHERE id IN (${idListString})
    `;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            message: '删除成功！'
        }));
    })
})
// 修改
router.put('/bag/:id',middleware, (req, res) => {
    let {
        name,
        brand,
        size,
        stock,
        original_price,
        current_price,
        shelf_status
    } = req.body;
    const id = req.body.id;
    // stock = stock ? false : true;
    // shelf_status = shelf_status ? false : true;
    const sql = `
    UPDATE bag SET name='${name}',brand='${brand}',size='${size}',stock=${stock},
    original_price=${original_price},current_price=${current_price},shelf_status=${shelf_status} WHERE id=${id}
    `;
    exec(sql).then(data => {
        console.log(data);
        res.json(new SuccessModel({
            message: '修改成功！'
        }));
    })
})
// 上传详情图片
router.post('/bag/detail_img',middleware, upload.single('avatar'), (req, res) => {
    const {
        file
    } = req;
    const {
        id
    } = req.body;
    const imgUrl = '/api/goods/bag/preview_img/' + file.filename;
    const sqlFindGoods = `SELECT * FROM bag WHERE id=${id}`;
    exec(sqlFindGoods).then(data =>{
        const newImgurl = data[0].detail_img_url ? data[0].detail_img_url +','+imgUrl : imgUrl;
        const sql = `UPDATE bag SET detail_img_url='${newImgurl}' WHERE id = ${id}`;
        exec(sql).then(data => {
            res.json(new SuccessModel({
                data: {
                    imgUrl: imgUrl,
                },
                message: '上传成功！'
            }))
        })
    })
})
// 预览图片
router.get('/bag/preview_img/:id', (req, res) => {
    const file = path.join(__dirname + '/static/upload/' + req.params.id);
    res.download(file);
})
// 删除详情图片
router.post('/bag/del_detail_img/:id',middleware,(req,res)=>{
    const {id,imgName} = req.body;
    const sqlFindGoods = `SELECT * FROM bag WHERE id=${id}`;
    exec(sqlFindGoods).then(data =>{
        const newImgurl = data[0].detail_img_url.split(',').filter(imgUrl =>{
            const _imgName = imgUrl.split('/').pop() || '';
            if(_imgName !== imgName){
                return imgUrl;
            }
        }).join(',');
        const sql = `UPDATE bag SET detail_img_url='${newImgurl}' WHERE id = ${id}`;
        exec(sql).then(data => {
            res.json(new SuccessModel({
                message: '删除成功！'
            }))
    })
})
})

// 上传展示图片
router.post('/bag/display_img',middleware, upload.single('avatar'), (req, res) => {
    const {
        file
    } = req;
    const {
        id
    } = req.body;
    const imgUrl = '/api/goods/bag/preview_img/' + file.filename;
    const sqlFindGoods = `SELECT * FROM bag WHERE id=${id}`;
    exec(sqlFindGoods).then(data =>{
        const newImgurl = data[0].display_img_url ? data[0].display_img_url +','+imgUrl : imgUrl;
        const sql = `UPDATE bag SET display_img_url='${newImgurl}' WHERE id = ${id}`;
        exec(sql).then(data => {
            res.json(new SuccessModel({
                data: {
                    imgUrl: imgUrl,
                },
                message: '上传成功！'
            }))
        })
    })
})
// 删除展示图片
router.post('/bag/del_display_img/:id',middleware,(req,res)=>{
    const {id,imgName} = req.body;
    const sqlFindGoods = `SELECT * FROM bag WHERE id=${id}`;
    exec(sqlFindGoods).then(data =>{
        const newImgurl = data[0].display_img_url.split(',').filter(imgUrl =>{
            const _imgName = imgUrl.split('/').pop() || '';
            if(_imgName !== imgName){
                return imgUrl;
            }
        }).join(',');
        const sql = `UPDATE bag SET display_img_url='${newImgurl}' WHERE id = ${id}`;
        exec(sql).then(data => {
            res.json(new SuccessModel({
                message: '删除成功！'
            }))
    })
})
})
module.exports = router;