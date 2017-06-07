export interface WinProcess {
    pid: number;
    desc: string;
    cmd: string;
    prog: string;
    workingSet: string;
}
export default function ps(callback?: Function): void;
