import { notification } from "antd";
import { ArgsProps } from "antd/lib/message";
import { timeStamp } from "console";
import { ReactNode } from "react";
import { BehaviorSubject, ReplaySubject } from "rxjs";
import { IMessageEvent, w3cwebsocket } from "websocket";
import { KnotdInfo } from "../models/knotd_info";
import KnotResponse from "../models/knotResponse";
import ZoneEntry from "../models/zoneEntry";

class KnotWSService {

  private knotSubject = new BehaviorSubject<KnotResponse>({ cmd: '', result: '' });
  public knot$ = this.knotSubject.asObservable();

  private knotdInfoSubject = new BehaviorSubject<KnotdInfo>({version: ''});
  public knotd_info$ = this.knotdInfoSubject.asObservable();

  private notificationSubject = new BehaviorSubject<KnotResponse|null>(null);
  public notifications$ = this.notificationSubject.asObservable();

  private response_waits: {[id:number]: (r: KnotResponse) => void} = {};
  private msg_counter = 0;
  private ws = this.make_ws();


  private ws_message_handlers: ((r: KnotResponse | any) => boolean)[] = [
    (r: any) => {
      console.log('hello handler', r);
      if (r.cmd === 'hello') {
        this.knotdInfoSubject.next(r.result);
      }
      return true;
    },
    (r: KnotResponse) => {
      if (r.cmd.match(/^((conf|zone)-set)/)) {
        this.notificationSubject.next(r);
      }
      return false;
    }
  ];

  private async make_ws() {
    return new Promise <w3cwebsocket>((resolve, reject) => {
      const ws_url = process.env.WS_URL || 'ws://localhost:7007/ws';
      const web_socket = new w3cwebsocket(ws_url);
      web_socket.onopen = () => {
       resolve(web_socket);
      }

      web_socket.onmessage = (msg) => {
        const knotv_msg: KnotResponse = JSON.parse(msg.data.toString());
        if(knotv_msg.id && this.response_waits[knotv_msg.id]) {
          this.response_waits[knotv_msg.id](knotv_msg);
          delete this.response_waits[knotv_msg.id];
        }
      }

      web_socket.onerror = (err) => {
        console.error('ws error', err);
        this.ws = this.make_ws()
      }
      web_socket.onclose = (ev) => console.log('ws closed', ev);
    });
  }

  public async knot_cmd(cmd: string): Promise<KnotResponse> {
    const id = (++this.msg_counter % 1024);
    const promise = new Promise<KnotResponse>((resolve,reject) => {
      this.response_waits[id] = (r) => resolve(r);
    });
    (await this.ws).send(JSON.stringify({ id: id, payload: cmd }));
    return promise;
  }


  private zone_entry_to_knotc(entry: ZoneEntry) {
    return `${entry.zone.trim()} ${entry.record.trim()} ${entry.ttl.trim()} ${entry.type.trim()} ${entry.value}`;
  }

  public async zone_read(zone?: string) {
    const cmd = `zone-read ${zone || '--'}`;
    return this.knot_cmd(cmd);
  }

  public async zone_begin(zone: string) {
    await this.knot_cmd(`zone-begin ${zone}`);
  }

  public async zone_abort(zone: string) {
    await this.knot_cmd(`zone-abort ${zone}`);
  }

  public async zone_unset(entry: ZoneEntry) {
    return this.knot_cmd(`zone-unset ${this.zone_entry_to_knotc(entry)}`);
  }

  public async zone_set(entry: ZoneEntry) {
    const cmd = `zone-set ${this.zone_entry_to_knotc(entry)}`;
    const response = await this.knot_cmd(cmd);
    return response;
  }

  public async zone_commit(zone: string) {
    const result = await this.knot_cmd(`zone-commit ${zone}`);
    await this.zone_read();
  }

}
const KnotWs = new KnotWSService();
export default KnotWs;