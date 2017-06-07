"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util_1 = require("./util");
const constants_1 = require("./constants");
class SpotifyPlayer extends events_1.EventEmitter {
    constructor(_helper) {
        super();
        this._helper = _helper;
        this.playing = false;
    }
    play(uri) {
        if (!uri || (this._helper.status
            && this._helper.status.track
            && this._helper.status.track.track_resource
            && this._helper.status.track.track_resource.uri
            && this._helper.status.track.track_resource.uri === uri)) {
            this.pause(true);
            return Promise.resolve({});
        }
        return util_1.getJSON({
            url: this._helper.generateSpotifyUrl('/remote/play.json'),
            headers: {
                'Origin': constants_1.ORIGIN_HEADER
            },
            params: {
                returnafter: 1,
                returnon: constants_1.RETURN_ON.join(','),
                oauth: this._helper.oauthToken,
                csrf: this._helper.csrfToken,
                uri,
                context: uri
            }
        });
    }
    pause(state) {
        return util_1.getJSON({
            url: this._helper.generateSpotifyUrl('/remote/pause.json'),
            headers: {
                'Origin': constants_1.ORIGIN_HEADER
            },
            params: {
                returnafter: 1,
                returnon: constants_1.RETURN_ON.join(','),
                oauth: this._helper.oauthToken,
                csrf: this._helper.csrfToken,
                pause: state
            }
        });
    }
    seek(seconds) {
        if (!this._helper.status || !this._helper.status.track || !this._helper.status.track.track_resource)
            return Promise.reject('No track is playing.');
        this._helper.status.playing_position = seconds;
        return this.play(`${this._helper.status.track.track_resource.uri}#${util_1.parseTime(seconds)}`);
    }
    setPlaying(playing) {
        this.playing = playing;
    }
    isPlaying() {
        return this.playing;
    }
}
exports.SpotifyPlayer = SpotifyPlayer;
