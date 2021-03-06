var mongoose = require('../utils/mongoose').mongoose;
var crypto = require('crypto');

var Schema = mongoose.Schema;



var QuestionSchema = new Schema({
    _id: Schema.Types.ObjectId,
    email : { type:String },
    question : { type:String },
    status : {type:Number,default:0},
    time : { type:Date, default:Date.now }
});

var ReplySchema = new Schema({
    QuestionId : {type:Schema.Types.Mixed,ref:"questions"},
    from_uid : { type:String ,index: true},
    to_uid : { type:String ,index: true},
    content : { type:String },
    chat_type : { type:String,default:'text'},
    image : { type:String,default:''},
    time : { type:Date, default:Date.now }
});

var QuestionModel = mongoose.model("questions", QuestionSchema);
var ReplyModel    = mongoose.model("question_reply",ReplySchema);

function addReply(qid,from_uid,to_uid,content,chat_type,image,callback) {
    var info = {
        "QuestionId" : qid,
        "from_uid" : from_uid,
        "to_uid" : to_uid,
        "content" : content,
        "chat_type" : chat_type,
        "image" : image,
    };
    var msgModel = new ReplyModel(info);
    msgModel.save(function(err, res){
        return callback(err,res);
    });
}

function queryReply(qid,page,size,uid,callback) {
    var query = ReplyModel.find({});
    var condition = [];
    condition.push({"QuestionId":qid});
    if(uid){
        condition.push({"from_uid":uid});
        condition.push({"to_uid":uid});
    }

    var skip = (page - 1) * size;
    query.or(condition).skip(skip).limit(size).sort({"time":-1}).exec(callback);
}


function addQuestion(email,question,callback) {
    var info = {
        "_id":new mongoose.Types.ObjectId,
        "email" : email,
        "question" : question,
    };
    var queModel = new QuestionModel(info);
    queModel.save(function(err, res){
        return callback(err,res);
    });
} 

function finishQuestion(id,callback) {
    QuestionModel.findOneAndUpdate({_id:id}, {status:1}, callback);
}

function queryQuestion(email,status=0,size=30,callback) {
    
    var query = QuestionModel.find();
    query.where("email").equals(email);
    if(status == -1 || status == null) {
        query.where('status').gt(-1);
    }
    
    query.limit(size).sort({"time":-1}).exec(callback);
}


function login(username,password,callback) {
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');
    var condition = {'username' : username,'password':password};

    UsersModel.findOne(condition, function(err, res){
        var _err = null;
        if (err) {
            _err = err;
        }
        if(!res){
            _err = '用户名密码不正确';
        }
        return callback(_err,res);
    })
}

function reset_psw(username,psw_old,psw_new,callback) {
    psw_old = crypto.createHash('md5').update(psw_old).digest('hex');
    UsersModel.find({username:username,password:psw_old},function (err,info) {
        if (err) {
            return callback(err,null);
        }

        if(!info || info.length == 0){
            return callback('原密码不正确',null);
        }
        psw_new = crypto.createHash('md5').update(psw_new).digest('hex');
        UsersModel.findOneAndUpdate({username:username,password:psw_old}, {password:psw_new}, callback);
    });
}



exports.addQuestion     = addQuestion;
exports.queryQuestion   = queryQuestion;
exports.finishQuestion  = finishQuestion;

exports.addReply        = addReply;
exports.queryReply      = queryReply;