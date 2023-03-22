export interface ZoneEntry {
    zone: string,
    record: string,
    ttl: number,
    type: string,
    value: string
}

export function parse_zone_data(data: string) {
    const lines = data.split('\n');
    const zone_data: ZoneEntry[] = [];
    for (const line of lines) {
        const parts = line.split(' ');
        for(const p in parts) {
            if (!p) {
                continue;
            }
            zone_data.push({
                zone: p[0],
                record: p[1],
                ttl: Number(p[2]),
                type: p[3],
                value: p[4]
            });
        }
    }
    return zone_data;
}