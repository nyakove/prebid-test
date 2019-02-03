const gulp = require('gulp');
require('./gulpfile.js');
const http = require('http');
const jsonfile = require('jsonfile');
var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});


const file = 'test.json'


function build() {

    console.dir('Start building...')

    gulp.series('build')(function (err) {
        if (err) {
            console.log(err)
        } else {
            jsonfile.readFile(file)
                .then(obj => console.dir(obj))
                .catch(error => console.error(error));
            console.dir('Building OK!')
        }
    });
}

function buildWebpack() {

    console.dir('Start building...')

    gulp.series('scripts')(function (err) {
        if (err) {
            console.log(err)
        } else {
            jsonfile.readFile(file)
                .then(obj => console.dir(obj))
                .catch(error => console.error(error));
            console.dir('Building OK!')
        }
    });
}


// GET method route
app.get('/', urlencodedParser, function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

// POST method route
app.post('/', urlencodedParser, function (req, res) {
    console.dir(req.body.rubicon);
    if (req.body.rubicon) {
        buildWebpack();
    }

    res.send('Your prebid.js is building rigth now and will be');
    
    // build();
});

app.listen(7000);

/*http.createServer(function(request, response){
    response.writeHead(200, {'Content-Type': 'text/x-json'});
    response.write(obj);
    response.end();
}).listen(7000);*/

//setTimeout(build, 5000);
