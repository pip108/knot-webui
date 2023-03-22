import { exec, spawn } from 'child_process';

export async function knotc_exec(params: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn('knotc', params);
        let data = '';
        proc.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        proc.on('close', () => {
            resolve(data);
        });
        proc.on('error', (err) => reject(err));
    });
}

export async function get_knotd_version(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';    
        const get_version = exec('knotd -V');
        get_version.stdout?.on('data', (chunk) => data += chunk.toString());
        get_version.on('error', (err) => reject(err));
        get_version.on('exit', () => {
            resolve(data);
        });
1    });
}

