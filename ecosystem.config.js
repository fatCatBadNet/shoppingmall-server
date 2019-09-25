module.exports = {
    apps:[
        // 正式环境
        {
            name:'production',
            script:'./bin/www',
            env:{
                "NODE_ENV": "production",
                "PORT": 3000
            }
        },
        // 测试
        {
            name:'development',
            script:'./bin/www',
            env:{
                "NODE_ENV": "development",
                "PORT": 3000
            }
        },
    ]
}