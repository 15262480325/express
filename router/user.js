const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const secret = 'lufei928';
let accountInfo = {};

//连接本地数据库
mongoose.connect('mongodb://localhost:27017/lufei' , (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log('链接成功');
    }
});

//创建骨架
const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    phone: Number,
    password: String,
    email: String,
    address: String,
    birthday: Number
});

//创建视图
let userModel = mongoose.model('user', userSchema, 'user');

//定义请求拦截器
router.use((req, res, next) => {
    //如果不是登录或者注册页面都需要在请求时带上token
    if (req.url !== '/register' && req.url !== '/login') {
        //解析token
        jwt.verify(req.headers.token, secret, (err, data) => {
            if (err)  return res.status(403).json({meg: '您已退出登录,请重新登录', success: false});
            //若果解析成功,去查去数据库看token里的用户信息是否存在
            userModel.find({phone: data.phone, password: data.password}, (err, data) => {
                if (err || data.length === 0) return res.status(403).json({meg: '无效的身份,请重新登录', success: false});
                accountInfo = data[0];
                next();
            })
        })
    } else {
        next();
    }
})

//查找用户信息
router.get('/find', (req, res) => {
    userModel.find({}, (err, data) => {
        if (!err) {
            return  res.json({meg: '', data, success: true});
        }
        return  res.status(500).json({meg: '获取用户信息失败,请稍后重试', success: false})
    });
})

//用户注册
router.post('/register', (req, res) => {
    //判断是否有手机号
    if (!req.body.phone)  return res.json({meg: '手机号不能为空,请输入手机号', success: false});
    //判断是否有密码
    if (!req.body.password) return res.json({msg: '密码不能为空,请输入密码', success: false});
    //更具手机号查询信息,判断此手机号是否被注册过
    userModel.find({phone: req.body.phone}, (err, data) => {
        if (data.length > 0) return res.json({msg: '手机号已注册,请重试', success: false});
        let result = new userModel({
            phone: req.body.phone,
            password: req.body.password
        })
        //用户注册操作
        result.save().then((response, len, err) => {
            if (!err) {
                return  res.json({meg: '注册成功', data: response.id, success: true});
            }
            return  res.status(500).json({meg: '注册失败,请稍后重试', success: false});
        })
    })
})

//用户登录
router.post('/login', (req, res) => {
    //判断是否有手机号
    if (!req.body.phone)  return res.json({meg: '手机号不能为空,请输入手机号', success: false});
    //判断是否有密码
    if (!req.body.password) return res.json({msg: '密码不能为空,请输入密码', success: false});
    //更具手机号去查找是有有此用户
    userModel.findOne({phone: req.body.phone}, (err, data) => {
        if (!data || Object.keys(data).length === 0) return res.json({msg: '没有此账号,请注册', success: false});
        //根据手机号查找到用户密码然后比对看是否一致,密码一致就登录
        if (data.password !== req.body.password) return res.json({msg: '密码错误,请重试', success: false});
        //登录成功返回token
        return res.json({msg: '登录成功', success: true, data: jwt.sign({phone: data.phone, password: data.password}, secret, { expiresIn: '8h' })})
    })
})

//编辑用户信息
router.post('/update', (req, res) => {
    //从用户提交的数据中提取出跟数据库字段值不相等的内容,然后更新
    let update = {};
    Object.keys(req.body).forEach(item => {
        if (req.body[item] !== accountInfo[item]) {
            update[item] = req.body[item];
        }
    });
    userModel.findByIdAndUpdate(accountInfo._id, update, (error, result) => {
        if (error) return res.status(500).json({msg: '系统错误,请稍后重试', success: false});
        return res.json({msg: '更新成功', success: true})
    })
})

//注销用户
router.post('/logoff', (req, res) => {
    userModel.findByIdAndRemove(accountInfo._id, {}, (err, data) => {
        if (err) return res.status(500).json({meg: '系统错误,请稍后重试', success: false});
        res.json({meg: '用户注销成功', success: true});
    })
})

module.exports = router;
