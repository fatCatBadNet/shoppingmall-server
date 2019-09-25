const express = require('express')
const fs = require('fs');
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
    if (token === '' || !token) {
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
router.get('/', middleware, (req, res, next) => {
    // const {currentPage,pageSize} = req.query;
    const query = req.query;
    const currentPage = query.currentPage || 1;
    const pageSize = query.pageSize || 10;
    const name = query.name || '';
    const brand = query.brand || '';
    const type = query.type || '';
    const recommend = query.recommend === 'true'? true : false;
    const banner = query.banner === 'true'? true : false;
    // 分页查询条件
    let sql = `SELECT * FROM goods WHERE 1=1 AND status=1 
    ${name ? `AND name LIKE '%${name}%'`:''} 
    ${brand ? `AND brand='${brand}'`:''}
    ${type ? `AND type='${type}'`:''}
    ${recommend ? `AND recommend=1`:''}
    ${banner ? `AND banner=1`:''}
    ORDER BY create_time DESC
    LIMIT ${(currentPage-1)*pageSize},${pageSize}`; //查询具体数据
    const sqlTotal = `
    SELECT COUNT(*) FROM goods WHERE status=1 
    ${name ? `AND name LIKE '%${name}%'`:''}
    ${brand ? `AND brand='${brand}'`:''}
    ${type ? `AND type='${type}'`:''}
    ${recommend ? `AND recommend=1`:''}
    ${banner ? `AND banner=1`:''}
    `; //表中总数
    exec(sql).then(data => {
        const newData = data.map(goods => {
            goods.detail_img_url = goods.detail_img_url ? goods.detail_img_url.split(',') : [];
            goods.display_img_url = goods.display_img_url ? goods.display_img_url.split(',') : [];
            goods.banner_img_url = goods.banner_img_url ? goods.banner_img_url.split(',') : [];
            return goods;
        })
        exec(sqlTotal).then(totalData => {
            res.json(new SuccessModel({
                list: newData,
                pagination: {
                    current: Number(currentPage),
                    pagination: Number(pageSize),
                    total: totalData[0]['COUNT(*)']
                }
            }))
        })
    })
})
// 新增
router.post('/', middleware, (req, res, next) => {
    let {
        name,
        brand,
        size,
        stock,
        type,
        original_price,
        current_price,
        shelf_status
    } = req.body;
    const createTime = Date.now();
    const sql =
        `INSERT INTO goods 
    (name,brand,size,stock,original_price,current_price,shelf_status,status,create_time,type)
    VALUES 
    ('${name}','${brand}','${size}',${stock},'${original_price}','${current_price}',${shelf_status},true,'${createTime}','${type}')`;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            id: data.insertId,
            message: '创建成功！'
        }));
    })
})
// 删除（支持批量）
router.post('/delete', middleware, (req, res) => {
    const {
        idList
    } = req.body;
    let idListString = idList.join(',');
    // DELETE FROM  bag WHERE id IN (${idListString})
    const sql = `
    UPDATE goods SET status=false WHERE id IN (${idListString})
    `;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            message: '删除成功！'
        }));
        exec(`SELECT * FROM goods WHERE id IN (${idListString})`).then(delList =>{
            delList.forEach(del =>{
                if(del.detail_img_url&& del.detail_img_url.length){
                    del.detail_img_url.split(',').forEach(imgName =>{
                        const filePath = path.join(__dirname + '/static/upload/' + imgName.split('/').pop());
                        fs.unlink(filePath,()=>{});
                    })                 
                }
                if(del.display_img_url && del.display_img_url.length){
                    del.display_img_url.split(',').forEach(imgName =>{
                        const filePath = path.join(__dirname + '/static/upload/' + imgName.split('/').pop());
                        fs.unlink(filePath,()=>{});
                    })                 
                }
            })
        })
    })
})
// 修改
router.put('/:id', middleware, (req, res) => {
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
    UPDATE goods SET name='${name}',brand='${brand}',size='${size}',stock=${stock},
    original_price=${original_price},current_price=${current_price},shelf_status=${shelf_status} WHERE id=${id}
    `;
    exec(sql).then(data => {
        res.json(new SuccessModel({
            message: '修改成功！'
        }));
    })
})
// 上传详情图片
router.post('/detail_img', middleware, upload.single('avatar'), (req, res) => {
    const {
        file
    } = req;
    const {
        id
    } = req.body;
    const imgUrl = '/api/goods/preview_img/' + file.filename;
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].detail_img_url ? data[0].detail_img_url + ',' + imgUrl : imgUrl;
        const sql = `UPDATE goods SET detail_img_url='${newImgurl}' WHERE id = ${id}`;
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
router.get('/preview_img/:id', (req, res) => {
    const file = path.join(__dirname + '/static/upload/' + req.params.id);
    res.download(file);
})
// 删除详情图片
router.post('/del_detail_img/:id', middleware, (req, res) => {
    const {
        id,
        imgName
    } = req.body;
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].detail_img_url.split(',').filter(imgUrl => {
            const _imgName = imgUrl.split('/').pop() || '';
            if (_imgName !== imgName) {
                return imgUrl;
            }
        }).join(',');
        const filePath = path.join(__dirname + '/static/upload/' + imgName);
        fs.unlink(filePath, (data) => {
            const sql = `UPDATE goods SET detail_img_url='${newImgurl}' WHERE id = ${id}`;
            exec(sql).then(data => {
                res.json(new SuccessModel({
                    message: '删除成功！'
                }))
            })
        })
    })
})
// 上传展示图片
router.post('/display_img', middleware, upload.single('avatar'), (req, res) => {
    const {
        file
    } = req;
    const {
        id
    } = req.body;
    const imgUrl = '/api/goods/preview_img/' + file.filename;
    console.log(imgUrl);
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].display_img_url ? data[0].display_img_url + ',' + imgUrl : imgUrl;
        const sql = `UPDATE goods SET display_img_url='${newImgurl}' WHERE id = ${id}`;
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
router.post('/del_display_img/:id', middleware, (req, res) => {
    const {
        id,
        imgName
    } = req.body;
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].display_img_url.split(',').filter(imgUrl => {
            const _imgName = imgUrl.split('/').pop() || '';
            if (_imgName !== imgName) {
                return imgUrl;
            }
        }).join(',');
        // 移除文件
        const filePath = path.join(__dirname + '/static/upload/' + imgName);
        fs.unlink(filePath, (data) => {
            const sql = `UPDATE goods SET display_img_url='${newImgurl}' WHERE id = ${id}`;
            exec(sql).then(data => {
                res.json(new SuccessModel({
                    message: '删除成功！'
                }))
            })
        })
    })
})
// 上传banner图片
router.post('/banner_img', middleware, upload.single('avatar'), (req, res) => {
    const {
        file
    } = req;
    const {
        id
    } = req.body;
    const imgUrl = '/api/goods/preview_img/' + file.filename;
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].banner_img_url ? data[0].banner_img_url + ',' + imgUrl : imgUrl;
        const sql = `UPDATE goods SET banner_img_url='${newImgurl}' WHERE id = ${id}`;
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
// 删除banner图片
router.post('/del_banner_img/:id', middleware, (req, res) => {
    const {
        id,
        imgName
    } = req.body;
    const sqlFindGoods = `SELECT * FROM goods WHERE id=${id}`;
    exec(sqlFindGoods).then(data => {
        const newImgurl = data[0].banner_img_url.split(',').filter(imgUrl => {
            const _imgName = imgUrl.split('/').pop() || '';
            if (_imgName !== imgName) {
                return imgUrl;
            }
        }).join(',');
        // 移除文件
        const filePath = path.join(__dirname + '/static/upload/' + imgName);
        fs.unlink(filePath, (data) => {
            const sql = `UPDATE goods SET banner_img_url='${newImgurl}' WHERE id = ${id}`;
            exec(sql).then(data => {
                res.json(new SuccessModel({
                    message: '删除成功！'
                }))
            })
        })
    })
})
// 改变推荐状态
router.put('/recommend/:id',middleware,(req,res)=>{
    const {
        id,
        status
    } = req.body;
    const sql = `UPDATE goods SET recommend=${status} WHERE id = ${id}`;
    exec(sql).then(data =>{
        res.json(new SuccessModel({
            message: '操作成功！'
        }))
    })
})
// 改变是否为banner状态
router.put('/banner/:id',middleware,(req,res)=>{
    const {
        id,
        status
    } = req.body;
    const sql = `UPDATE goods SET banner=${status} WHERE id = ${id}`;
    exec(sql).then(data =>{
        res.json(new SuccessModel({
            message: '操作成功！'
        }))
    })
})
module.exports = router;