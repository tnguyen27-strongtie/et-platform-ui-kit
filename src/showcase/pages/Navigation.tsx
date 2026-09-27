import { useState } from 'react';

import {
  Accordion,
  ExpandCollapseAllButton,
  FormField,
  NavMenu,
  notify,
  NumberInput,
  Section,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  TopNav,
  useAccordionGroup,
} from '../../index';
import { DemoPage, DemoSection } from '../layout';

export function Navigation() {
  const [tab, setTab] = useState('input');
  const [load, setLoad] = useState<number | null>(1250);
  const group = useAccordionGroup(['connection', 'loads', 'members'] as const);
  const single = useAccordionGroup(['seismic', 'wind', 'geometry'] as const, { exclusive: true, initial: { seismic: true } });

  return (
    <DemoPage title="Navigation" description="Moving between views and sections.">
      <DemoSection
        id="top-nav"
        title="TopNav and NavMenu"
        description="App bar (54px) with menus. The full app shell (drawer, help, settings) lives in libs/shell."
        code={`<TopNav logo={<Logo />} right={<UserMenu />}>
  <NavMenu label="File" items={[{ id: 'new', label: 'New', onSelect: create }]} />
</TopNav>`}
      >
        <div className="overflow-hidden rounded-sm border border-border">
          <TopNav logo={<span className="text-lg font-bold text-accent">Calculator</span>} right={<span className="text-sm text-text-muted">v2.1</span>}>
            <NavMenu
              label="File"
              items={[
                { id: 'new', label: 'New project', onSelect: () => notify.info('New project') },
                { id: 'open', label: 'Open…', onSelect: () => notify.info('Open') },
                { id: 'upload', label: 'Upload (disabled)', disabled: true, onSelect: () => undefined },
              ]}
            />
            <NavMenu label="Help" items={[{ id: 'guide', label: 'Design guide', onSelect: () => notify.info('Guide') }]} />
          </TopNav>
        </div>
      </DemoSection>

      <DemoSection
        id="tabs"
        title="Tabs"
        description="Switch views of the same thing. Arrow keys / Home / End move between tabs. keepMounted keeps a hidden panel's state (form input, running queries)."
        code={`<Tabs id="calc" value={tab} onChange={setTab}>
  <Tab value="input" label="Input" />
</Tabs>
<TabPanel tabsId="calc" value="input" current={tab} keepMounted>…</TabPanel>`}
      >
        <div className="flex flex-col border border-true-gray-20">
          <Tabs id="demo-tabs" value={tab} onChange={setTab} aria-label="Calculator views">
            <Tab value="input" label="Input" />
            <Tab value="output" label="Output" />
            <Tab value="report" label="Report (disabled)" disabled />
          </Tabs>
          <TabPanel tabsId="demo-tabs" value="input" current={tab} keepMounted className="p-3">
            <FormField label="Design load (kept when you switch tabs)" htmlFor="tab-load">
              <NumberInput value={load} onChange={setLoad} addonAfter="lbs" />
            </FormField>
          </TabPanel>
          <TabPanel tabsId="demo-tabs" value="output" current={tab} className="p-3">
            <p className="m-0 text-sm">Capacity for {load ?? '—'} lbs: OK</p>
          </TabPanel>
        </div>
      </DemoSection>

      <DemoSection
        id="accordion"
        title="Accordion"
        description="Collapsible input groups. useAccordionGroup + ExpandCollapseAllButton give the Input panel its collapse-all button. exclusive keeps one section open at a time. headingLevel fits the page outline."
        code={`const group = useAccordionGroup(['connection', 'loads'] as const);
<Section title="Input" actions={<ExpandCollapseAllButton group={group} />}>
  <Accordion title="Connection" {...group.item('connection')}>…</Accordion>
</Section>
// One open at a time (no expand-all button)
const single = useAccordionGroup(['seismic', 'wind'] as const, { exclusive: true, initial: { seismic: true } });`}
      >
        <div className="h-96 border border-true-gray-20">
          <Section title="Input" actions={<ExpandCollapseAllButton group={group} />}>
            <Accordion title="Connection" {...group.item('connection')}>
              <FormField label="Connection name" htmlFor="acc-name">
                <TextInput defaultValue="Wood to wood" />
              </FormField>
            </Accordion>
            <Accordion title="Loads" {...group.item('loads')}>
              <p className="m-0 text-sm">Load inputs go here.</p>
            </Accordion>
            <Accordion title="Members" {...group.item('members')}>
              <p className="m-0 text-sm">Member inputs go here.</p>
            </Accordion>
          </Section>
        </div>
        <div>
          <Accordion title="Seismic (exclusive group)" {...single.item('seismic')}>
            <p className="m-0 text-sm">Opening another section closes this one.</p>
          </Accordion>
          <Accordion title="Wind" {...single.item('wind')}>
            <p className="m-0 text-sm">Wind inputs go here.</p>
          </Accordion>
          <Accordion title="Geometry" {...single.item('geometry')}>
            <p className="m-0 text-sm">Geometry inputs go here.</p>
          </Accordion>
        </div>
        <Accordion title="Standalone, collapsed by default" defaultExpanded={false}>
          <p className="m-0 text-sm">Uncontrolled accordion.</p>
        </Accordion>
      </DemoSection>
    </DemoPage>
  );
}
