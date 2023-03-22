import { BehaviorSubject, map } from "rxjs";
import KnotResponse from "../models/knotResponse";
import ZoneEntry from "../models/zoneEntry";
import { FILTER_ANY } from "../models/zoneFilter";
import { ZoneInfo } from "../models/zoneInfo";
import KnotWs from "./knotws.service";

class ZoneServiceClass {

    private zoneSubject = new BehaviorSubject<ZoneEntry[]>([]);
    public zones$ = this.zoneSubject.pipe(map((zone_data) => zone_data.filter(x => x.zone && x.type !== 'SOA')));
    private selectedSubject = new BehaviorSubject<ZoneEntry[]>([]);
    public selected$ = this.selectedSubject.asObservable();

    private editsSubject = new BehaviorSubject<ZoneEntry[]>([]);
    public edits$ = this.editsSubject.asObservable();

    public stats$ = this.zones$.pipe(map((zone_data) => {
        const stats: {
            [key: string]: // record type
            {
                [key: string]: number, // count by zone
                total: number
            } // total
        } = {}
        const types = zone_data.map(z => {
            if (!stats[z.type]) {
                stats[z.type] = { total: 0 }
            }
            if (!stats[z.type][z.zone]) {
                stats[z.type][z.zone] = 0;
            }
            stats[z.type].total++;
            stats[z.type][z.zone]++;

        });
        return stats;
    }));

    constructor() {
       this.init();
    }

    private async init() {
        const response = await KnotWs.zone_read();
        this.zoneSubject.next(this.parse_zones(response.result));
    }

    private parse_zones(data: string): ZoneEntry[] {
        const lines = data.split('\n');
        const zone_data: ZoneEntry[] = [];
        for (const line of lines) {
            if (!line) {
                continue;
            }
            let hash = '';
            const hash_check = line.split('#');
            if (hash_check.length > 1) {
                hash = hash_check[1];
            }
            const part_a = hash_check[0].split(' ', 4);
            const parts = [...part_a, hash_check[0].slice(hash_check[0].indexOf(part_a[3]) + part_a[3].length)];
            zone_data.push({
                zone: parts[0].slice(1, -2),
                record: parts[1],
                ttl: parts[2],
                type: parts[3],
                value: parts[4],
                hash
            });
        }
        return zone_data;
    }

    public async delete_many(entries: ZoneEntry[]) {
        const zones = Array.from(new Set(entries.map(x => x.zone)));
        for (const zone of zones) {
            await KnotWs.zone_begin(zone);
        }
        const job: Promise<KnotResponse>[] = [];
        for (const entry of entries) {
            job.push(KnotWs.zone_unset(entry));
        }
        const result = await Promise.all(job);
        if (result.every(x => x.result === 'OK\n')) {
            for (const zone of zones) {
                await KnotWs.zone_commit(zone);
            }
        }
    }

    public set_selected_entries(entries: ZoneEntry[]) {
        this.selectedSubject.next(entries);
    }

    public edit_entry(entry: ZoneEntry, index: number) {
        const edited_entry = { ...entry };
        const update = [edited_entry, ...this.editsSubject.value];
        this.editsSubject.next(update);
    }

    public add_record(zone?: string, type?: string) {
        const new_entry: ZoneEntry = {
            zone: zone || FILTER_ANY,
            record: '',
            ttl: '',
            type: type && type !== FILTER_ANY ? type : '',
            value: ''
        };
        const zones_updated = [new_entry, ...this.zoneSubject.value];
        console.log(zones_updated);
        this.zoneSubject.next(zones_updated);
        this.editsSubject.next([new_entry, ...this.editsSubject.value]);
    }

    public async update_record(record: ZoneEntry) {
        const previous = this.editsSubject.value.find(x => x.hash === record.hash);
        const zone = record.zone;
        await KnotWs.zone_begin(zone);
        if (previous) {
            await KnotWs.zone_unset(previous);
        }
        const response = await KnotWs.zone_set(record);;
        if (response.result === 'OK\n') {
            await KnotWs.zone_commit(zone);
        } else {
            await KnotWs.zone_abort(zone);
            return response;
        }

        const update = this.editsSubject.value.filter(x => x.hash !== record.hash);
        this.editsSubject.next([...update]);
        return response;
    }

    public async delete_record(record: ZoneEntry) {
        const i = this.zoneSubject.value.indexOf(record);
        if (i > 0) {
            const s = [...this.zoneSubject.value];
            s.splice(i, 1);
            this.zoneSubject.next(s);
        }

        await KnotWs.zone_begin(record.zone);
        const response = await KnotWs.zone_unset(record);
        if (response.result === 'OK\n') {
            await KnotWs.zone_commit(record.zone);
        }
        return response;
    }

    public cancel_edit(record: ZoneEntry) {
        let idx = this.editsSubject.value.findIndex(x => x.hash === record.hash);
        if (idx > -1) {
            const update = this.editsSubject.value;
            update.splice(idx, 1);
            this.editsSubject.next([...update]);
            idx = this.zoneSubject.value.indexOf(record);
            if (idx > -1) {
                this.zoneSubject.value.splice(idx, 1);
                this.zoneSubject.next([...this.zoneSubject.value]);
            }
        }
    }

    public async create_zone(zone: ZoneInfo) {
        const new_zone = { ...zone };
        for (const k of Object.keys(new_zone)) {
            new_zone[k] = new_zone[k].trim().replace('\n', '');
        }

        await KnotWs.knot_cmd('conf-begin');
        await KnotWs.knot_cmd(`conf-set zone.domain ${zone.zone}`);
        await KnotWs.knot_cmd(`conf-set zone[${new_zone.zone}]'`);
        await KnotWs.knot_cmd(`conf-set zone[${new_zone.zone}].storage  /var/lib/knot/zones`);
        await KnotWs.knot_cmd(`conf-set zone[${new_zone.zone}].file = ${new_zone.zone}.zone`);
        await KnotWs.knot_cmd(`conf-commit`)

        await KnotWs.zone_begin(new_zone.zone);
        await KnotWs.zone_set({ zone: new_zone.zone, record: `${new_zone.zone}.`, type: 'SOA', ttl: new_zone.ttl, value: `${new_zone.mname} ${new_zone.rname} ${new_zone.serial} ${new_zone.refresh} ${new_zone.retry} ${new_zone.expire} ${new_zone.minimum}` })
        await KnotWs.zone_commit(new_zone.zone);

        KnotWs.zone_read();
    }

    public async delete_zone(zone: string) {

    }
}

const ZoneService = new ZoneServiceClass();
export default ZoneService;
