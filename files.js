const _fs = require('fs');
const express = require('express');
const favicon = require('express-favicon');
const app = express();

let adaptersList = async function () {
    var path = './tstmod';
    var options = {
        withFileTypes: true
    };

    var filesArray = await _fs.promises.readdir(path, options);

    var files = [];

    for (file of filesArray) {
        if (file.name.slice(-13) == 'BidAdapter.js')
            files.push(file.name.slice(0, -3))
    }

    await _fs.promises.writeFile('test.json', JSON.stringify(files));

    let json = await _fs.promises.readFile('test.json', 'utf-8');

    return json;

}

app.use(favicon(__dirname + '/favicon.ico'));

app.get('/getList', async function (req, res) {
    let response = await adaptersList();
    res.type('json');
    res.send(response);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/files.html')
});

app.listen(8080, function () {
    console.dir('Server started at port 8080');
})
