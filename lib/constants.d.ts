export declare const ORIGIN_HEADER = "https://open.spotify.com";
export declare const START_HTTPS_PORT = 4370, END_HTTPS_PORT = 4379, START_HTTP_PORT = 4380, END_HTTP_PORT = 4389, RETURN_ON: string[], SPOTIFY_WEBHELPER_REGEX: RegExp;
export declare type CsrfToken = {
    error?: Error;
    token?: string;
};
export declare type OAuthToken = {
    t: string;
};
