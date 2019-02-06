const gulp = require('gulp');
require('./gulpfile.js');
const http = require('http');
var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const fs = require('fs.extra');
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});

app.get('/', urlencodedParser, function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/', urlencodedParser, function (req, res) {

    var obj = req.body;
    var modulesNames = [];
    if (obj.rubicon) {
        modulesNames.push(obj.rubicon)
    }
    if (obj.appnexus) {
        modulesNames.push(obj.appnexus)
    }
    if (obj.criteo) {
        modulesNames.push(obj.criteo)
    }
    console.dir(modulesNames);

    var json = JSON.stringify(modulesNames);

    var path = './modules.json';

    fs.outputJson(path, modulesNames, err => {
        if (err) {
            console.log(err)
        }
    })
    console.dir('Start building...');

    gulp.series('build')(function (err) {
        if (err) {
            console.log(err)
        } else {
            console.dir('Building OK!');
            res.redirect('/download');
        }
    });
});

app.get('/download', function (req, res) {
    var file = __dirname + `/build/dist/${(new Date()).toISOString().substring(0, 10)}_prebid.js`;
    res.download(file);
});

app.listen(7000);
console.dir ('Server started at 127.0.0.1:7000');