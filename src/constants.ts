export const ORIGIN_HEADER = 'https://open.spotify.com';
export const START_HTTPS_PORT = 4370,
  END_HTTPS_PORT = 4379,
  START_HTTP_PORT = 4380,
  END_HTTP_PORT = 4389,
  RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'],
  SPOTIFY_WEBHELPER_REGEX = new RegExp('spotifywebhelper.exe', 'i');

export type CsrfToken = {
  error?: Error;
  token?: string;
};

export type OAuthToken = {
  t: string;
};