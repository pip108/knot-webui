import { DeleteOutlined, FastForwardFilled } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, notification, Result, Row, Select, Table } from "antd";
import { ArgsProps } from "antd/lib/notification";
import { ColumnsType, TableProps } from "antd/lib/table";
import { ColumnFilterItem } from "antd/lib/table/interface";
import { useEffect, useState } from "react";
import { filter, map, take, tap } from "rxjs";
import KnotResponse from "../models/knotResponse";
import { DNS_FILTER, DNS_RECORD_TYPES } from "../models/record_types";
import ZoneEntry from "../models/zoneEntry";
import ZoneFilter, { FILTER_ANY } from "../models/zoneFilter";
import ZoneService from "../service/zone.service";
import './zoneTable.css';


const ZoneTable = (props: { filter: ZoneFilter }) => {

    const [zone_data, set_zone_data] = useState<ZoneEntry[]>([]);
    const [zones_available, set_zones_available] = useState<string[]>([]);
    const [edited_entries, set_edited_entries] = useState<ZoneEntry[]>([]);
    const [dns_filter, set_dns_filter] = useState(DNS_FILTER);
    const [scrollY, setScrollY] = useState(window.innerHeight - 160);

    useEffect(() => {
        const l = () => {
            setScrollY(window.innerHeight - 160)
        }
        window.addEventListener('resize', l);
        return () => window.removeEventListener('resize', l);
    }, []);

    useEffect(() => {
        const s = ZoneService.zones$.pipe(
            tap(
                zd => set_zones_available(Array.from(new Set(zd.map(x => x.zone))))
            ),
            tap(zd => console.log(`zd, props.filter.zone=${props.filter.zone}`, zd)),
            map(zone_data => zone_data
                .filter(x => Object.values(dns_filter).every(x => x === false) || dns_filter[x.type] === true)
                .filter(x => props.filter.zone === FILTER_ANY || !x.hash || x.zone === props.filter.zone)
                .filter(x => {
                    const f = props.filter.text;
                    return x.record === '' || x.record === '' || x.zone === ''
                        || x.record.includes(f) || x.value.includes(f) || x.zone.includes(f)
                })
            )).subscribe(zone_data => {
                set_zone_data(zone_data);
            });
        return () => s.unsubscribe();
    }, [props.filter.zone, dns_filter]);


    useEffect(() => {
        const s = ZoneService.edits$.subscribe(edits => set_edited_entries(edits));
        return () => s.unsubscribe()
    }, []);


    const is_edited = (entry: ZoneEntry) => {

        return edited_entries.some(x => x.hash === entry.hash)
    }

    const dns_select_options = DNS_RECORD_TYPES.map(type => <Select.Option key={type}>{type}</Select.Option>);
    const zone_select_options = zones_available.map(zone => <Select.Option key={zone}>{zone}</Select.Option>);

    const renderValue = (value: any, entry: ZoneEntry, key: React.Key | undefined) => {
        if (entry.type === 'NS' && key === 'ttl') {
            return <></>
        }
        if (key === 'zone') {
            return <>[{`${value}`}]</>
        }
        return value;
    }

    const renderCell = (value: any, entry: ZoneEntry, key: React.Key | undefined) => {
        if (edited_entries.some(x => x.hash === entry.hash)) {
            if (key == 'type') {
                return <Input.Group key={`${key}.edit`}>
                    <Select value={value} style={{ width: '100%' }} onChange={(value) => {
                        entry.type = value;
                        set_zone_data([...zone_data]);
                    }}>
                        {dns_select_options}
                    </Select>
                </Input.Group>
            }
            if (key === 'zone') {
                return <Input.Group style={{ textAlign: 'center' }}>
                    <Select value={value} style={{ width: '100%' }} onChange={(value) => {
                        entry.zone = value;
                        set_zone_data([...zone_data]);
                    }}>
                        {zone_select_options}
                    </Select>

                </Input.Group>
            }
            if (key === 'ttl' && entry.type === 'NS') {
                return <></>
            }
            return <input value={value} style={{ maxWidth: '100%', lineHeight: '2em', paddingLeft: '1em', backgroundColor: '#ffffff20', color: '#dfdfdf', border: 'none' }} onChange={(e) => {
                if (key) {
                    //ZoneService.add_edited_entry(entry);
                    (entry as any)[key] = e.target.value
                    set_zone_data([...zone_data]);
                }
            }}></input>
        }
        return <div key={`${key}.view`} style={{ width: '100%', height: '100%' }}>
            {renderValue(value, entry, key)}
        </div>;
    }

    const cancel_edit = async (entry: ZoneEntry) => {
        console.log('cancel_edit', entry);
        ZoneService.cancel_edit(entry);
    }

    const edit_entry = (entry: ZoneEntry, index: number) => {
        console.log('edit', entry);
        ZoneService.edit_entry(entry, index);
    }

    const show_notification = (response: KnotResponse) => {
        const success = response.result === 'OK\n';
        const config: ArgsProps = {
            duration: success ? 1 : 5,
            message: success ? 'Success' : 'Operation failed',
            description: <span style={{fontFamily: 'DejaVu Sans Mono'}}><p>{response.cmd}</p><p style={{fontWeight: 'bold'}}>{response.result}</p></span>
        };
        success ? notification.success(config) : notification.error(config);
    }

    const save_entry = async (entry: ZoneEntry, index: number) => {
        show_notification(await ZoneService.update_record(entry));
        
    }

    const delete_entry = async (entry: ZoneEntry, index: number) => {
        show_notification(await ZoneService.delete_record(entry));
    }


    const dns_type_filter_dropdown = <table className="type-filter" style={{ fontSize: '10pt', padding: '5px' }}>
        <tbody>
            {DNS_RECORD_TYPES
                .map(type => <tr key={type}>
                    <td>{type}</td><td><Checkbox onChange={(e) => { dns_filter[type] = e.target.checked; set_dns_filter({ ...dns_filter }) }} /></td>
                </tr>)}
        </tbody>
    </table>;

    const columns: ColumnsType<ZoneEntry> = [
        { title: 'Zone', dataIndex: 'zone', key: 'zone', width: '150px' },
        { title: 'Record', dataIndex: 'record', align: 'left', key: 'record', width: '300px' },
        { title: 'TTL', dataIndex: 'ttl', align: 'center', key: 'ttl', width: '100px' },
        { title: 'Type', dataIndex: 'type', align: 'center', key: 'type', width: '100px', filterDropdown: dns_type_filter_dropdown },
        { title: 'Value', dataIndex: 'value', align: 'left', key: 'value' },
    ];

    columns.forEach(col => {
        col.render = (value, entry, key) => renderCell(value, entry, col.key);
    });
    columns.push({
        title: 'Actions', colSpan: 2, width: '70px', align: 'center', render: (_, entry) => {
            return is_edited(entry) ? <a onClick={() => cancel_edit(entry)}>Cancel</a> :
                <a onClick={() => edit_entry(entry, zone_data.indexOf(entry))}>Edit</a>
        }
    })
    columns.push({ width: '70px', align: 'center', render: (_, entry) => {
        return is_edited(entry) ? <a onClick={() => save_entry(entry, zone_data.indexOf(entry))}>Save</a> :
         <a onClick={() => delete_entry(entry, zone_data.indexOf(entry))}>Delete</a>; 
    }});
    return <Table className="zone-table" size="small" scroll={{ y: scrollY, x: '100%' }} bordered={true}
        pagination={false} style={{ padding: '0' }} rowSelection={{
            onChange: (_, rows) => {
                ZoneService.set_selected_entries(rows);
            }
        }} rowKey={(entry) => zone_data.indexOf(entry)} columns={columns} dataSource={zone_data}></Table>
}

export default ZoneTable;