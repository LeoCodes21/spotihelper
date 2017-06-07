"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
;
function ps(callback) {
    if (!callback)
        callback = (err, list) => { };
    child_process_1.exec('wmic process list /format:csv', {
        maxBuffer: 2000 * 1024
    }, (err, stdout) => {
        if (err) {
            callback({
                err: err,
                msg: 'unable to enumerate processes'
            });
            return;
        }
        let stdoutArray = stdout.replace(/\r/g, '').split('\n').slice(1);
        let fields = stdoutArray.shift().split(',');
        let output = {};
        stdoutArray.forEach(function (line) {
            const parts = line.split(',');
            let entry = {};
            for (let i = 0; i < fields.length; ++i) {
                entry[fields[i]] = parts[i];
            }
            let e = {
                pid: entry['Handle'],
                desc: entry['Description'],
                cmd: entry['CommandLine'],
                prog: entry['ExecutablePath'],
                workingSet: entry['WorkingSetSize']
            };
            if (!e.cmd) {
                delete e.cmd;
            }
            if (!e.prog) {
                delete e.prog;
            }
            if (e.pid) {
                output[e.pid] = e;
            }
        });
        callback(null, output);
    });
}
exports.default = ps;
