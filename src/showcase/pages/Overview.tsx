import { Card, Link } from '../../index';
import { catalog } from '../catalog';
import { DemoPage, href } from '../layout';

export function Overview() {
  const sectionCount = catalog.reduce((n, p) => n + p.sections.length, 0);
  const exportCount = new Set(catalog.flatMap((p) => p.sections.flatMap((s) => s.exports))).size;
  return (
    <DemoPage
      title="Platform UI Kit"
      description={`${sectionCount} demos covering ${exportCount} exports in ${catalog.length} groups. Change the brand color and text size in the top bar; every page follows them.`}
    >
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((p) => (
          <Card key={p.page} title={<Link href={href(p.page)}>{p.title}</Link>} titleAs="h2" subtitle={`${p.sections.length} demos`}>
            <p className="m-0 mb-2 text-xs text-text-muted">{p.description}</p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {p.sections.map((s) => (
                <li key={s.id} className="flex flex-col">
                  <Link href={href(p.page, s.id)} className="text-sm">
                    {s.title}
                  </Link>
                  <span className="text-xs text-text-muted">{s.exports.join(', ')}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </DemoPage>
  );
}
