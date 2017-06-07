export declare const FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";
export interface JsonRequest {
    params?: {
        [key: string]: any;
    };
    headers?: {
        [key: string]: string | number;
    };
    url: string;
}
export declare function getJSON(obj: JsonRequest): Promise<object>;
export declare function parseTime(time: number): string;
