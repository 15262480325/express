const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const user = require('./router/user');
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/user', user);

app.listen(3000, (err) => {
    if (err) throw err;
    console.log('监听3000端口成功!')
})
