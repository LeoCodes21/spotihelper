/// <reference path='./types/process-exists.d.ts' />

import { getJSON } from './util';
import { format } from 'util';
import { spawn } from 'child_process';

import ps from './lib/wintools-ps';

import { Status } from './entity/Status';
import { SpotifyPlayer } from './SpotifyPlayer';

import {
  START_HTTP_PORT, END_HTTP_PORT,
  START_HTTPS_PORT, END_HTTPS_PORT,
  ORIGIN_HEADER, SPOTIFY_WEBHELPER_REGEX,
  RETURN_ON,
  CsrfToken, OAuthToken
} from './constants';

export class SpotifyWebHelper {
  private localPort: number = START_HTTP_PORT;

  oauthToken: string;

  csrfToken: string;

  status: Status;
  player: SpotifyPlayer;

  private seekingInterval;

  constructor() {
    this.player = new SpotifyPlayer(this);

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

  getCsrfToken() : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      return getJSON({
        url: this.generateSpotifyUrl('/simplecsrf/token.json'),
        headers: {
          'Origin': ORIGIN_HEADER
        }
      }).then((res: CsrfToken) => {
        if (res.error) {
          reject(new Error(res.error.message));
        } else {
          resolve(res.token);
        }
      })
      .catch(reject);
    });
  }

  getOauthToken() : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      getJSON({
        url: 'http://open.spotify.com/token'
      })
      .then((res: OAuthToken) => resolve(res.t))
      .catch(reject);
    });
  }

  detectPort() : Promise<number> {
    return getJSON({
      url: this.generateSpotifyUrl('/service/version.json'),
      headers: {
        'Origin': ORIGIN_HEADER
      },
      params: {
        'service': 'remote'
      }
    })
    .then(() => this.localPort)
    .catch((err) => {
      if (this.localPort === END_HTTP_PORT) {
        throw err;
      } else if (this.localPort === END_HTTPS_PORT) {
        this.localPort = START_HTTP_PORT;
      } else {
        this.localPort++;
      }

      return this.detectPort();
    });
  }

  generateSpotifyUrl(url: string) : string {
    let protocol = 'https://';

    if (this.localPort >= START_HTTP_PORT && this.localPort <= END_HTTP_PORT) {
      protocol = 'http://';
    }

    return format('%s%s:%d%s', protocol, '127.0.0.1', this.localPort, url);
  }

  getStatus() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      getJSON({
        url: this.generateSpotifyUrl('/remote/status.json'),
        headers: {
          'Origin': ORIGIN_HEADER
        },
        params: {
          returnafter: 1,
          returnon: RETURN_ON.join(','),
          oauth: this.oauthToken,
          csrf: this.csrfToken
        }
      })
      .then((res: Status) => {
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

  private ensureSpotifyWebHelper() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.isSpotifyWebHelperRunning()
        .then((running: boolean) : any => { // ugh
          if (running) {
            return resolve();
          }

          return this.startSpotifyWebHelper();
        })
        .catch(reject);
    });
  }

  private startSpotifyWebHelper() : Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let child = spawn(this.getWebHelperPath(), [], {
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
        })
    });
  }

  private getWebHelperPath() {
    if (process.platform === 'win32') {
      return require('user-home') + '\\AppData\\Roaming\\Spotify\\SpotifyWebHelper.exe';
    }

    return require('user-home') + '/Library/Application Support/Spotify/SpotifyWebHelper';
  }

  private isSpotifyWebHelperRunning(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let processExists = require('process-exists');

      if (process.platform === 'darwin') {
        return processExists('SpotifyWebHelper')
          .then(resolve)
          .catch(reject);
      } else if (process.platform === 'win32') {
        ps((err, list) => {
          if (err) {
            return reject(err);
          }

          return resolve(
            Object.keys(list)
              .map(k => list[k])
              .some(p => SPOTIFY_WEBHELPER_REGEX.test(p.desc)));
        });
      } else {
        // Automatically starts on Linux
        return resolve(true);
      }
    });
  }

  private statusCheck(status: Status) {
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

  private compareStatus(status: Status) {
    let hasError = this.statusCheck(status);

    if (hasError) { return; }

    this.player.emit('status-will-change', status);
    let hasUri = track =>
      track && track.track_resource && track.track_resource.uri;

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
      } else {
        this.player.setPlaying(false);
        if (Math.abs(status.playing_position - status.track.length) <= 1) {
          this.player.emit('end');
        }
        this.player.emit('pause');
        this.stopSeekingInterval();
      }
    }
  }

  private startSeekingInterval() {
    this.seekingInterval = setInterval(() => {
      this.status.playing_position += 0.25;
    }, 250);
  }

  private stopSeekingInterval() {
    clearInterval(this.seekingInterval);
  }

  private listen() {
    getJSON({
      url: this.generateSpotifyUrl('/remote/status.json'),
      headers: {
        'Connection': 'keep-alive',
        'Origin': ORIGIN_HEADER
      },
      params: {
        returnafter: 60,
        returnon: RETURN_ON.join(','),
        oauth: this.oauthToken,
        csrf: this.csrfToken
      }
    })
    .then((res: Status) => {
      this.compareStatus(res);
      this.status = res;

      let hasError = this.compareStatus(res);
			if (hasError) {
				setTimeout(() => this.listen(), 5000);
			} else {
				this.listen();
			}
    })
    .catch(err => this.player.emit('error', err));
  }
}