import { Button, Form, Input } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useEffect, useState } from "react";
import { map } from "rxjs";
import KnotResponse from "../models/knotResponse";
import KnotWs from "../service/knotws.service";
import './knotc.component.css';

function row_calc() {
    const font_pt_in_px = (72 / 96) * 10;
    return Math.floor(window.innerHeight * 0.54 / (font_pt_in_px * 1.2) - 3);
}

const KnotCComponent = () => {

    const [knotc_output, set_knotc_ouput] = useState<string>('');
    const [knot_cmd, set_knot_cmd] = useState('');
    const [rows, set_rows] = useState(row_calc());


    
    const send_knotc_command = async () => {
        if (knot_cmd) {
            const response = await KnotWs.knot_cmd(knot_cmd);
            set_knotc_ouput([knotc_output, response.result].join('\n'));
        }
    }

    const key_down = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey && e.code == 'KeyL') {
            e.preventDefault();
            set_knotc_ouput('');
        } else if (e.key == 'Enter') {
            send_knotc_command();
        }
    }

    useEffect(() => {
        const listener = () => {
            const rows = row_calc();
            console.log('set_rows', rows);
            set_rows(rows);
        };
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, []);

    return <Form layout='horizontal' style={{ display: 'flex', flexFlow: 'column' }} >
        <Form.Item style={{ flexGrow: '1' }} className='knotc-output'>
            <Input.TextArea id='knotc-output' rows={rows} allowClear={false}
                style={{ fontFamily: 'Noto Sans Mono', fontSize: '10pt', lineHeight: '1.2' }}
                size='middle' value={knotc_output}></Input.TextArea>
        </Form.Item>
        <Form.Item>
            <Input autoFocus={true} prefix='knotc >' value={knot_cmd} onChange={e => set_knot_cmd(e.target.value)}
                onKeyDown={(e) => key_down(e)}></Input>
        </Form.Item>
    </Form>
}

export default KnotCComponent;