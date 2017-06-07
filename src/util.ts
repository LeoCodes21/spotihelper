import * as qs from 'querystring';
import axios from 'axios';

export const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

export interface JsonRequest {
  params?: {[key: string]: any};

  headers?: {[key: string]: string | number};

  url: string;
}

export function getJSON(obj: JsonRequest) : Promise<object> {
  return new Promise<object>((resolve, reject) => {
    if (obj.params) {
      obj.url += `?${qs.stringify(obj.params)}`;
    }

    if (obj.headers)
      obj.headers['User-Agent'] = FAKE_USER_AGENT;
    else
      obj.headers = {'User-Agent': FAKE_USER_AGENT};

    axios.get(obj.url, {
      headers: obj.headers
    }).then(response => {
      resolve(response.data);
    }).catch(err => {
      reject(err);
    });
  });
}

export function parseTime(time: number) : string {
  let full = Math.round(time);
  let mins = Math.floor(full / 60);
  let seconds = full - (mins * 60);
  let secondsStr = seconds.toString();

  if (seconds < 10) {
    secondsStr = '0' + seconds;
  }

  return mins + ':' + secondsStr;
}