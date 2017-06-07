"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs = require("querystring");
const axios_1 = require("axios");
exports.FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
function getJSON(obj) {
    return new Promise((resolve, reject) => {
        if (obj.params) {
            obj.url += `?${qs.stringify(obj.params)}`;
        }
        if (obj.headers)
            obj.headers['User-Agent'] = exports.FAKE_USER_AGENT;
        else
            obj.headers = { 'User-Agent': exports.FAKE_USER_AGENT };
        axios_1.default.get(obj.url, {
            headers: obj.headers
        }).then(response => {
            resolve(response.data);
        }).catch(err => {
            reject(err);
        });
    });
}
exports.getJSON = getJSON;
function parseTime(time) {
    let full = Math.round(time);
    let mins = Math.floor(full / 60);
    let seconds = full - (mins * 60);
    let secondsStr = seconds.toString();
    if (seconds < 10) {
        secondsStr = '0' + seconds;
    }
    return mins + ':' + secondsStr;
}
exports.parseTime = parseTime;
