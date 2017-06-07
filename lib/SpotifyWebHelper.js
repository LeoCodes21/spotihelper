"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const util_2 = require("util");
const child_process_1 = require("child_process");
const wintools_ps_1 = require("./lib/wintools-ps");
const SpotifyPlayer_1 = require("./SpotifyPlayer");
const constants_1 = require("./constants");
class SpotifyWebHelper {
    constructor() {
        this.localPort = constants_1.START_HTTP_PORT;
        this.player = new SpotifyPlayer_1.SpotifyPlayer(this);
        this.ensureSpotifyWebHelper()
            .then(() => this.detectPort())
            .then(() => this.getOauthToken())
            .then(token => {
            this.oauthToken = token;
            return this.getCsrfToken();
        })
            .then(token => {
            this.csrfToken = token;
        })
            .then(() => {
            return this.getStatus();
        })
            .then(() => {
            return this.listen();
        })
            .catch(err => console.error(err));
    }
    getCsrfToken() {
        return new Promise((resolve, reject) => {
            return util_1.getJSON({
                url: this.generateSpotifyUrl('/simplecsrf/token.json'),
                headers: {
                    'Origin': constants_1.ORIGIN_HEADER
                }
            }).then((res) => {
                if (res.error) {
                    reject(new Error(res.error.message));
                }
                else {
                    resolve(res.token);
                }
            })
                .catch(reject);
        });
    }
    getOauthToken() {
        return new Promise((resolve, reject) => {
            util_1.getJSON({
                url: 'http://open.spotify.com/token'
            })
                .then((res) => resolve(res.t))
                .catch(reject);
        });
    }
    detectPort() {
        return util_1.getJSON({
            url: this.generateSpotifyUrl('/service/version.json'),
            headers: {
                'Origin': constants_1.ORIGIN_HEADER
            },
            params: {
                'service': 'remote'
            }
        })
            .then(() => this.localPort)
            .catch((err) => {
            if (this.localPort === constants_1.END_HTTP_PORT) {
                throw err;
            }
            else if (this.localPort === constants_1.END_HTTPS_PORT) {
                this.localPort = constants_1.START_HTTP_PORT;
            }
            else {
                this.localPort++;
            }
            return this.detectPort();
        });
    }
    generateSpotifyUrl(url) {
        let protocol = 'https://';
        if (this.localPort >= constants_1.START_HTTP_PORT && this.localPort <= constants_1.END_HTTP_PORT) {
            protocol = 'http://';
        }
        return util_2.format('%s%s:%d%s', protocol, '127.0.0.1', this.localPort, url);
    }
    getStatus() {
        return new Promise((resolve, reject) => {
            util_1.getJSON({
                url: this.generateSpotifyUrl('/remote/status.json'),
                headers: {
                    'Origin': constants_1.ORIGIN_HEADER
                },
                params: {
                    returnafter: 1,
                    returnon: constants_1.RETURN_ON.join(','),
                    oauth: this.oauthToken,
                    csrf: this.csrfToken
                }
            })
                .then((res) => {
                this.status = res;
                this.player.emit('ready');
                this.player.emit('status-will-change', res);
                if (res.playing) {
                    this.player.emit('play');
                    this.startSeekingInterval();
                    this.player.emit('track-will-change', res.track);
                }
                resolve();
            })
                .catch(reject);
        });
    }
    ensureSpotifyWebHelper() {
        return new Promise((resolve, reject) => {
            this.isSpotifyWebHelperRunning()
                .then((running) => {
                if (running) {
                    return resolve();
                }
                return this.startSpotifyWebHelper();
            })
                .catch(reject);
        });
    }
    startSpotifyWebHelper() {
        return new Promise((resolve, reject) => {
            let child = child_process_1.spawn(this.getWebHelperPath(), [], {
                detached: true
            });
            child.on('error', function (err) {
                reject(new Error(`Spotify isn't installed - ${err.message}`));
            });
            child.unref();
            this.isSpotifyWebHelperRunning()
                .then(running => {
                if (running)
                    resolve(true);
                else
                    reject(new Error('Cannot start Spotify.'));
            });
        });
    }
    getWebHelperPath() {
        if (process.platform === 'win32') {
            return require('user-home') + '\\AppData\\Roaming\\Spotify\\SpotifyWebHelper.exe';
        }
        return require('user-home') + '/Library/Application Support/Spotify/SpotifyWebHelper';
    }
    isSpotifyWebHelperRunning() {
        return new Promise((resolve, reject) => {
            let processExists = require('process-exists');
            if (process.platform === 'darwin') {
                return processExists('SpotifyWebHelper')
                    .then(resolve)
                    .catch(reject);
            }
            else if (process.platform === 'win32') {
                wintools_ps_1.default((err, list) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(Object.keys(list)
                        .map(k => list[k])
                        .some(p => constants_1.SPOTIFY_WEBHELPER_REGEX.test(p.desc)));
                });
            }
            else {
                return resolve(true);
            }
        });
    }
    statusCheck(status) {
        if (!status.open_graph_state) {
            this.player.emit('error', new Error('No user logged in'));
            return true;
        }
        if (status.error) {
            this.player.emit('error', new Error(status.error.message));
            return true;
        }
        return false;
    }
    compareStatus(status) {
        let hasError = this.statusCheck(status);
        if (hasError) {
            return;
        }
        this.player.emit('status-will-change', status);
        let hasUri = track => track && track.track_resource && track.track_resource.uri;
        if (hasUri(this.status.track)
            && hasUri(status.track)
            && this.status.track.track_resource.uri !== status.track.track_resource.uri) {
            this.player.emit('track-will-change', status.track);
        }
        this.player.setPlaying(status.playing);
        if (this.status.playing !== status.playing) {
            if (status.playing) {
                this.player.emit('play');
                this.startSeekingInterval();
            }
            else {
                this.player.setPlaying(false);
                if (Math.abs(status.playing_position - status.track.length) <= 1) {
                    this.player.emit('end');
                }
                this.player.emit('pause');
                this.stopSeekingInterval();
            }
        }
    }
    startSeekingInterval() {
        this.seekingInterval = setInterval(() => {
            this.status.playing_position += 0.25;
        }, 250);
    }
    stopSeekingInterval() {
        clearInterval(this.seekingInterval);
    }
    listen() {
        util_1.getJSON({
            url: this.generateSpotifyUrl('/remote/status.json'),
            headers: {
                'Connection': 'keep-alive',
                'Origin': constants_1.ORIGIN_HEADER
            },
            params: {
                returnafter: 60,
                returnon: constants_1.RETURN_ON.join(','),
                oauth: this.oauthToken,
                csrf: this.csrfToken
            }
        })
            .then((res) => {
            this.compareStatus(res);
            this.status = res;
            let hasError = this.compareStatus(res);
            if (hasError) {
                setTimeout(() => this.listen(), 5000);
            }
            else {
                this.listen();
            }
        })
            .catch(err => this.player.emit('error', err));
    }
}
exports.SpotifyWebHelper = SpotifyWebHelper;
