export default interface ZoneEntry {
    id?: string,
    zone: string;
    record: string;
    ttl: string;
    type: string;
    value: string;
    hash?: string;
}