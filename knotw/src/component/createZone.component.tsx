import { Button, Col, Form, Input, Layout, Row } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useState } from 'react';
import { ZoneInfo } from '../models/zoneInfo';
import ZoneService from '../service/zone.service';
import './createZone.component.css';

const CreateZone = () => {
    

    const [new_zone, set_new_zone] = useState<ZoneInfo>({
        zone: '',
        mname: 'ns1',
        rname: 'hostmaster',
        serial: '1111111111',
        refresh: '86400',
        retry: '7200',
        expire: '604800',
        ttl: '11200',
        minimum: '86400'
    });

    const [field_values, set_field_values] = useState<{[key:string]: string}>({
        zone: '',
        mname: 'ns1',
        rname: 'hostmaster',
        serial: '1111111111',
        refresh: '86400',
        retry: '7200',
        expire: '604800',
        ttl: '11200',
        minimum: '86400'

    });

    const create_zone = () => {
        console.log(new_zone);
    }

    const value_change = (field: string, val: string) => {
        field_values[field] = val;
        set_field_values({...field_values});
    }


    const fields = [
        { name: 'zone', label: 'Zone name', value: new_zone.zone },
        { name: 'mname', label: 'MNAME', value: new_zone.mname },
        { name: 'rname', label: 'RNAME', value: new_zone.rname },
        { name: 'serial', label: 'Serial', value: new_zone.serial },
        { name: 'refresh', label: 'Refresh', value: new_zone.refresh },
        { name: 'retry', label: 'Retry', value: new_zone.retry},
        { name: 'expire', label: 'Expire', value: new_zone.expire },
        { name: 'ttl', label: 'TTL', value: new_zone.ttl },
        { name: 'minimum', label: 'Minimum', value: new_zone.minimum },
    ];

    return <Form layout={'horizontal'}  labelCol={{span: 2}} wrapperCol={{span: 12}}>
            { fields.map(f => <Form.Item key={f.name} name={f.name} label={f.label}><Input value={field_values[f.name]} onChange={(e) => value_change(f.name, e.target.value)} /></Form.Item>)}
            <Col offset={10} span={4}>

            <Input type='submit' value='Create zone' onClick={(e) => { e.preventDefault(); create_zone(); }} />
            </Col>
        
    </Form>
}

export default CreateZone;