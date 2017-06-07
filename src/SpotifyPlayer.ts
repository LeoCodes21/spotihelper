import { EventEmitter } from 'events';
import { SpotifyWebHelper } from './SpotifyWebHelper';
import { getJSON, parseTime } from './util';

import {
  START_HTTP_PORT, END_HTTP_PORT,
  START_HTTPS_PORT, END_HTTPS_PORT,
  ORIGIN_HEADER, RETURN_ON,
  CsrfToken, OAuthToken
} from './constants';

export class SpotifyPlayer extends EventEmitter {
  private playing: boolean;

  constructor(private _helper: SpotifyWebHelper) {
    super();

    this.playing = false;
  }

  play(uri: string) : Promise<object> {
    if (!uri || (this._helper.status
      && this._helper.status.track
      && this._helper.status.track.track_resource
      && this._helper.status.track.track_resource.uri
      && this._helper.status.track.track_resource.uri === uri)) {
        this.pause(true);
        return Promise.resolve({});
      }

      return getJSON({
        url: this._helper.generateSpotifyUrl('/remote/play.json'),
        headers: {
          'Origin': ORIGIN_HEADER
        },
        params: {
          returnafter: 1,
          returnon: RETURN_ON.join(','),
          oauth: this._helper.oauthToken,
          csrf: this._helper.csrfToken,
          uri,
          context: uri
        }
      });
  }

  pause(state: boolean) : Promise<object> {
    return getJSON({
      url: this._helper.generateSpotifyUrl('/remote/pause.json'),
      headers: {
        'Origin': ORIGIN_HEADER
      },
      params: {
        returnafter: 1,
        returnon: RETURN_ON.join(','),
        oauth: this._helper.oauthToken,
        csrf: this._helper.csrfToken,
        pause: state
      }
    });
  }

  seek(seconds: number) : Promise<object> {
    if (!this._helper.status || !this._helper.status.track || !this._helper.status.track.track_resource)
      return Promise.reject('No track is playing.');

    this._helper.status.playing_position = seconds;
    return this.play(`${this._helper.status.track.track_resource.uri}#${parseTime(seconds)}`)
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
  }

  isPlaying() : boolean {
    return this.playing;
  }
}