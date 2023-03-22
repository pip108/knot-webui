import { Menu, Layout, Space, Affix, Button, notification, } from 'antd';
import { useEffect, useState } from 'react';
import './App.css';
import ZoneService from './service/zone.service';
import { DNS_RECORD_TYPES } from './models/record_types';
import { Content, Footer } from 'antd/lib/layout/layout';
import KnotCComponent from './component/knotc.component';
import Sider from 'antd/lib/layout/Sider';
import ControlsComponent from './component/controls.component';
import ZoneTable from './component/zoneTable';
import { map, take, tap } from 'rxjs';
import CreateZone from './component/createZone.component';
import ZoneFilter, { FILTER_ANY } from './models/zoneFilter';
import { DatabaseOutlined, DiffOutlined, FileAddOutlined, FileTextFilled, FileTextOutlined, FolderOpenFilled, MenuUnfoldOutlined, TabletFilled } from '@ant-design/icons';
import KnotWs from './service/knotws.service';
import MenuItem from 'antd/lib/menu/MenuItem';
import { FaAd, FaAsterisk, FaTerminal } from 'react-icons/fa';
import knotv from './knotv_version.json';
import { MenuInfo } from 'rc-menu/lib/interface';

function App() {
  const [zones, setZones] = useState<string[]>([]);
  const [view_page, set_view_page] = useState(0)
  const [filter, setFilter] = useState<ZoneFilter>({ zone: FILTER_ANY, type: FILTER_ANY, text: '' });
  const [total_records, set_total_records] = useState(0);
  const [knotd_version, set_knotd_version] = useState('');

  useEffect(() => {
    const s = KnotWs.notifications$.subscribe(r => {
      if (!r ||view_page === 1) {
        return;
      }
      if (r.result === 'OK\n') {
        notification.success({
          message: r.cmd,
          description: r.result,
          duration: 5
        });
      } else {
        notification.error({
          message: r.cmd,
          description: r.result,
          duration: 5
        });
      }
    });
    return () => s.unsubscribe();
  },[]);

  useEffect(() => {
    const s = KnotWs.knotd_info$.subscribe(knfo => set_knotd_version(knfo.version.replace('(Knot DNS), version', '')));
    return () => s.unsubscribe();
  }, [])

  useEffect(() => {
    const s = ZoneService.zones$.pipe(map(x => Array.from(new Set(x.map(x => x.zone))))).subscribe(z => {
      setZones([...z]);
    })
    return () => s.unsubscribe();
  }, []);

  useEffect(() => {
    const s = ZoneService.stats$.subscribe(stats => {
      const total_by_zone = Object.keys(stats)
      const total = total_by_zone.length > 0 ? total_by_zone.map(k => stats[k].total).reduce((t,v) => t += v) : 0;
      set_total_records(total);
    });
    return () => s.unsubscribe();
  }, []);

  const filter_zone_change = (zone: string) => {
    setFilter({ ...filter, ...{ zone: zone } });
  }

  const filter_text_change = (text: string) => {
    setFilter({ ...filter, ...{ text } });
  }

  const render_page = () => {
    switch (view_page) {
      case 1:
        return <KnotCComponent />
      case 2:
        return <CreateZone />
      case 0:
      default:
        return <>
          <ControlsComponent filter={filter} zone_changed={(zone) => filter_zone_change(zone)}
            filter_changed={(text) => filter_text_change(text)} />
          <ZoneTable filter={filter} />
        </>;
    }
  }

  console.log('zones', zones);

  const handle_navigation = (e: MenuInfo) => {
    const p = e.key.split('/', 2);
    console.log(p);
    switch (p[0]) {
      case 'z':
        filter_zone_change(p[1]);
        set_view_page(0);        break;
      case '+':
        set_view_page(2);
        break;
      case 'c':
        const go_to = p[1] === 'log' ? 3 : 1;
        set_view_page(go_to);
        break;
    }
  }


  const app =
    <Layout style={{ flexDirection: 'row', overflow: 'hidden' }}>
      <Sider style={{ minHeight: '100vh' }}>

        <Menu mode={'inline'} style={{ background: 'transparent' }} inlineIndent={16} onClick={(e) => handle_navigation(e)} >

          <Menu.ItemGroup>
            <Menu.Item icon={<DatabaseOutlined />} key={`z/${FILTER_ANY}`}>All zones</Menu.Item>
            {zones.filter(zone =>zone !== FILTER_ANY).map((zone) => <Menu.Item key={`z/${zone}`} title={zone} icon={<FileTextOutlined />}>
              {zone}
            </Menu.Item>)}
          </Menu.ItemGroup>

          <Menu.Divider />

          <Menu.Item key='+' icon={<FileAddOutlined/>}>New zone</Menu.Item>          
          <Menu.Divider />

          <Menu.Item key={'c/shell'} icon={<FaTerminal />}>knotc shell</Menu.Item>

        </Menu>


        <div className="custom-side" style={{ left: '-0', bottom: '0', position: 'absolute', width: '100%', height: '50%', display: 'flex', flexFlow: 'column-reverse' }}>
          <div className='side-wrapper'>
            <p className='application-info'>knotv <br/>{knotv.knotv_version}</p>
          </div>
          <div className='side-wrapper'>
            <p className='application-info'>
            </p>
          </div>
        </div>
      </Sider>
      <Layout style={{ flexDirection: 'column' }}>
        <Content style={{ paddingLeft: '1em', paddingTop: '1em', paddingRight: '1em'}}>
          <>{render_page()}</>
        </Content>
        {view_page !== 1 && <Footer style={{ padding: '0 20px 0 20px' }}>
          <div style={{ textAlign: 'center', borderTop: '1px solid #ffffffca' }}>
            <p className='application-info' style={{ marginTop: '4px' }}>
              {knotd_version} | serving {total_records} records from {zones.length} zones
            </p></div>
        </Footer>}
      </Layout>
    </Layout>
  return app;
}

export default App;
