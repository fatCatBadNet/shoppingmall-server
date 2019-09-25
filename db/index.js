const mysql = require('mysql');
const {MYSQL_CONF} = require('../conf/db');
const con = mysql.createConnection(MYSQL_CONF);
con.connect();

const exec = (sql)=>{
    const promise = new Promise((resolve,reject)=>{
        con.query(sql,(err,res)=>{
            if(err){
                reject(err);
                return;
            }
            resolve(res);
            return;
        })
    })
    return promise;
}

module.exports = {
    exec
}