/**
 * 返回格式为
 * {
 * data:{},
 * erron:0
 * 0：无错误
 * 1：存在错误
 * 主要负责：包装数据
 * }
 */
class BaseModel {
    constructor(data, message) {
        if (typeof data === 'string') { //无具体数据数据返回
            this.message = data;
            data = null;
            message = null;
        }
        if (data) {
            this.data = data;
        }
        if (message) {
            this.message = message;
        }
    }
}

class SuccessModel extends BaseModel {
    constructor(data, message) {
        super(data, message)
        this.erron = 0;
    }

}

class ErrorModel extends BaseModel {
    constructor(data, message) {
        super(data, message)
        this.erron = 1;
    }
}

module.exports = {
    SuccessModel,
    ErrorModel
}