/// <reference types="node" />
import { EventEmitter } from 'events';
import { SpotifyWebHelper } from './SpotifyWebHelper';
export declare class SpotifyPlayer extends EventEmitter {
    private _helper;
    private playing;
    constructor(_helper: SpotifyWebHelper);
    play(uri: string): Promise<object>;
    pause(state: boolean): Promise<object>;
    seek(seconds: number): Promise<object>;
    setPlaying(playing: boolean): void;
    isPlaying(): boolean;
}
