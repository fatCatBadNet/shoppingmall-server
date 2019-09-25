const request = require('request')
 
const {
  exec
} = require('../db/index')

//获取汇率
function getNewEXchange(url,type){
    request.get(url,(error, response, body)=>{
      if (!error && response.statusCode == 200) {
          const newBody = JSON.parse(body);
          if(newBody.status === 0){
             const rate = newBody.result.rate;
             const sql = `UPDATE rates SET rate='${rate}' WHERE type = '${type}'`;
             console.log(sql);
             exec(sql).then(data =>{
                console.log(data);
             })
          }
      }
    })
  }

const scheduleList = () => {
    const usdUrl = 'https://api.jisuapi.com/exchange/convert?appkey=0c0875d785159e40&from=USD&to=CNY&amount=1';
    const koreaUrl = 'https://api.jisuapi.com/exchange/convert?appkey=0c0875d785159e40&from=KRW&to=CNY&amount=1';  
    getNewEXchange(usdUrl,'usd');
    getNewEXchange(koreaUrl,'korea');
}

module.exports = {
    scheduleList
}