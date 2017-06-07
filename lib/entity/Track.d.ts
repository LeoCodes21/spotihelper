import { Resource } from './Resource';
export interface Track {
    track_resource: Resource;
    artist_resource: Resource;
    album_resource: Resource;
    length: number;
    track_type: string;
}
