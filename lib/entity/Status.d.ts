import { BaseResponse } from '../BaseResponse';
import { Track } from './Track';
export interface Status extends BaseResponse {
    playing: boolean;
    shuffle: boolean;
    repeat: boolean;
    play_enabled: boolean;
    prev_enabled: boolean;
    next_enabled: boolean;
    track: Track;
    playing_position: number;
    context: object;
    server_time: number;
    volume: number;
    online: boolean;
    running: boolean;
    open_graph_state: object;
    error: {
        message: string;
    };
}
