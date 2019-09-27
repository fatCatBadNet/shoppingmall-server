const env = process.env.NODE_ENV;

let MYSQL_CONF;
if(env === 'development'){ //开发环境
    // mysql
    MYSQL_CONF = {
        // host: 'localhost',
        // port: '3306',
        // user: 'root',
        // password: '123456',
        // database: 'shoppingmall'
        host: '106.54.199.131',
        port: '3306',
        user: 'root',
        password: 'WAwlp4762237*',
        database: 'test-shoppingmall',
        useConnectionPooling: true
    }

}

if(env === 'production'){
    // mysql
    MYSQL_CONF = {
        host: '106.54.199.131',
        port: '3306',
        user: 'root',
        password: 'WAwlp4762237*',
        database: 'test-shoppingmall',
        useConnectionPooling: true
    }
}
module.exports = {
    MYSQL_CONF
}