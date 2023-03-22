import { DeleteOutlined, ExclamationCircleOutlined, FileAddOutlined, LogoutOutlined, MoreOutlined, PlusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Divider, Dropdown, Form, Input, Menu } from "antd";
import Item from "antd/lib/list/Item";
import useItems from "antd/lib/menu/hooks/useItems";
import { useEffect, useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { DNS_RECORD_TYPES } from "../models/record_types";
import ZoneEntry from "../models/zoneEntry";
import ZoneFilter, { FILTER_ANY } from "../models/zoneFilter";
import ZoneService from "../service/zone.service";


const ControlsComponent = (props: {
    filter: ZoneFilter,
    zone_changed: (zone: string) => void,  filter_changed: (text: string) => void
}) => {


    const [filter, setFilter] = useState('');
    const [selected, set_selected] = useState<ZoneEntry[]>([]);
    const [btn_method_active, set_btn_method_active] = useState(1);

    useEffect(() => {
        const s = ZoneService.selected$.subscribe(s => set_selected(s));
        return () => s.unsubscribe();
    }, []);


    const filter_change = (text: string) => {
        props.filter_changed(text);
        setFilter(text);
    }

    const button_menu = (<Menu items={[
        { label: 'New record', key: '1', icon: <PlusOutlined />, onClick: () => { btn_click(1); set_btn_method_active(1); } },
        { label: 'Delete selected', key: '3', icon: <LogoutOutlined />, onClick: () => { btn_click(3); set_btn_method_active(3); } },
        { label: 'Delete zone', key: '4', icon: <DeleteOutlined />, onClick: () => { btn_click(4); set_btn_method_active(4); } },
    ]}></Menu>);

    const btn_click = async (i: number) => {
        switch (i) {
            case 1:
                ZoneService.add_record(props.filter.zone, props.filter.type);
                break;
            case 3:
                await ZoneService.delete_many(selected);
                set_selected([]);
                break;
            case 4:
                console.log('Delete zone');
                break;
            default:
                break;

        }
    }

    const btn_txt = (i: number) => {
        if (i === 1) {
            return 'Add record';
        }
        if (i === 2) {
            return 'Add zone';
        }
        if (i === 3) {
            return 'Delete selected';
        }
        return 'Delete zone';
    }

    const btn_icon = (i: number) => {
        switch (i) {
            case 1:
                return <PlusOutlined />;
            case 2:
                return <FileAddOutlined />;
            case 3:
                return <LogoutOutlined />
            case 4:
                return <DeleteOutlined />
            default:
                return <ExclamationCircleOutlined />
        }
    }

    return <div style={{ display: 'flex', lineHeight: '2.5em'}}>
        <div style={{width: '100%', marginBottom: '5px'}}>
            <Input prefix='Search:' value={filter} onClick={(e) => console.log(e)} onChange={e => filter_change(e.target.value)} style={{ minWidth: '100%' }} />
        </div>
        <div style={{ marginLeft: '10px', display: 'inline-block' }}>
            <Dropdown.Button overlay={button_menu} onClick={() => btn_click(btn_method_active)} buttonsRender={() => {
                return [<Button onClick={() => btn_click(btn_method_active)} icon={btn_icon(btn_method_active)}>{btn_txt(btn_method_active)}</Button>,
                 <Button icon={<MoreOutlined />}></Button>];
            }}>
            </Dropdown.Button>
        </div>
    </div>
}
export default ControlsComponent;