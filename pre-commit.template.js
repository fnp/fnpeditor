/* jshint node: true */
'use strict';

var exec = require('child_process').exec;
var fs = require('fs');

exec('git diff --cached --name-status', function (err, stdout) {
    void(err);
    var toLint = [];
    stdout.split('\n').forEach(function(line) {
        var filePath = line.split('\t')[1];
        if(filePath && filePath.substr(-3) === '.js' && fs.existsSync(filePath)) {
            toLint.push(filePath);
        }
    });
    if(toLint.length) {
        exec('grunt {{task}} {{args}} --jshint-targets=' + toLint.join(','), function (err, stdout) {
            console.log(stdout);
            process.exit(err ? -1 : 0);
        });
    }
});
