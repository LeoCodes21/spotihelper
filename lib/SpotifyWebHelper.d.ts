/// <reference path="../src/types/process-exists.d.ts" />
import { Status } from './entity/Status';
import { SpotifyPlayer } from './SpotifyPlayer';
export declare class SpotifyWebHelper {
    private localPort;
    oauthToken: string;
    csrfToken: string;
    status: Status;
    player: SpotifyPlayer;
    private seekingInterval;
    constructor();
    getCsrfToken(): Promise<string>;
    getOauthToken(): Promise<string>;
    detectPort(): Promise<number>;
    generateSpotifyUrl(url: string): string;
    getStatus(): Promise<void>;
    private ensureSpotifyWebHelper();
    private startSpotifyWebHelper();
    private getWebHelperPath();
    private isSpotifyWebHelperRunning();
    private statusCheck(status);
    private compareStatus(status);
    private startSeekingInterval();
    private stopSeekingInterval();
    private listen();
}
