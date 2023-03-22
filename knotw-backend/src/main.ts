import express from 'express';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { get_knotd_version, knotc_exec } from './knotws';
import { createHash } from 'crypto';

const app = express();
app.use(express.json());
const port = Number(process.env.PORT) || 3001;

app.get('/', (_, res) => res.send(`port ${port}`));

interface KnotvCmd {
    id: number;
    payload: string
}

function start() {
    console.log(`knotw-backend ${process.env.knotv_version}`);
    process.on('SIGINT', () => process.exit());
    const server = app.listen(port, async () => {
        const knotd_version = await get_knotd_version();
        const ws_server = new WebSocketServer({ server });

        ws_server.on('connection', (socket, req) => {
            console.log('WebSocket connected');
            socket.send(JSON.stringify({ cmd: 'hello', result: { version: knotd_version }}));

            socket.on('message', async (msg) => {
                const knotv_cmd: KnotvCmd = JSON.parse(msg.toString());
                const knotc_cmd_raw = knotv_cmd.payload;
                console.log('raw', knotc_cmd_raw);

                const final = knotc_cmd_raw.split('"')
                    .filter(x => x)
                    .map(x => 
                        x.startsWith("'") ? [x.replace(/'/g, '\"')] : x.split(' ').filter(x => x))
                    .flatMap(a => a);
                    
                console.log('final', final);
                const result = await knotc_exec(final);
                const result_lines = result.split('\n');
                const resul_hashes = result_lines
                    .flatMap(line => line.startsWith('[') ? `${line}#${createHash('sha256').update(line).digest('hex')}` : line)
                    .join('\n');

                const response = {
                    id: knotv_cmd.id,
                    cmd: knotc_cmd_raw,
                    result: resul_hashes
                };
                socket.send(JSON.stringify(response));
            });
        });
        console.log(`http://localhost:${port}`);
    });
}
start()