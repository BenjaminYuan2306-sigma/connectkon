import { useEffect, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { usageEnabled, setUsageEnabled } from '@/lib/analytics-client';
import { Download, Upload, ArrowUpRight, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  type Network,
  type Person,
  daysSince,
  fmt,
  today,
} from '@/lib/network';
import { repository, validateNetwork } from '@/lib/persistence';
import { Modal, Choice, Avatar } from './UI';
export type Filters = {
  strength: string;
  company: string;
  industry: string;
  tag: string;
  last: string;
  follow: string;
};
export const noFilters: Filters = {
  strength: 'Any strength',
  company: 'All companies',
  industry: 'All industries',
  tag: 'All tags',
  last: 'Any time',
  follow: 'Any follow-up',
};
export function FilterPanel({
  filters,
  onChange,
  people,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  people: Person[];
  onClose: () => void;
}) {
  return (
    <Modal
      title="Filter your network"
      description="Combine filters to find the people you want to reconnect with."
      onClose={onClose}
    >
      <div className="form-grid">
        <Choice
          label="Relationship strength"
          value={filters.strength}
          options={['Any strength', '1+', '2+', '3+', '4+', '5']}
          onChange={(v) => onChange({ ...filters, strength: v })}
        />
        <Choice
          label="Company"
          value={filters.company}
          options={[
            'All companies',
            ...new Set(people.map((p) => p.company).filter(Boolean)),
          ]}
          onChange={(v) => onChange({ ...filters, company: v })}
        />
        <Choice
          label="Industry"
          value={filters.industry}
          options={[
            'All industries',
            ...new Set(people.map((p) => p.industry).filter(Boolean)),
          ]}
          onChange={(v) => onChange({ ...filters, industry: v })}
        />
        <Choice
          label="Tag"
          value={filters.tag}
          options={['All tags', ...new Set(people.flatMap((p) => p.tags))]}
          onChange={(v) => onChange({ ...filters, tag: v })}
        />
        <Choice
          label="Last contact"
          value={filters.last}
          options={[
            'Any time',
            'Last 7 days',
            'Last 30 days',
            'Last 90 days',
            'More than 30 days',
            'More than 90 days',
          ]}
          onChange={(v) => onChange({ ...filters, last: v })}
        />
        <Choice
          label="Follow-up"
          value={filters.follow}
          options={['Any follow-up', 'No follow-up', 'Due soon', 'Overdue']}
          onChange={(v) => onChange({ ...filters, follow: v })}
        />
      </div>
      <div className="form-footer">
        <button onClick={() => onChange(noFilters)}>Clear filters</button>
        <button className="primary" onClick={onClose}>
          Show connections
        </button>
      </div>
    </Modal>
  );
}
export function Followups({
  people,
  onOpen,
  onClose,
}: {
  people: Person[];
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="ck-sheet">
        <SheetTitle>Keep the conversation going.</SheetTitle>
        <SheetDescription>
          A small follow-up can make a big difference.
        </SheetDescription>
        {['Overdue', 'Due today', 'Upcoming'].map((group) => {
          const list = people
            .filter(
              (p) =>
                p.followUp &&
                (group === 'Overdue'
                  ? p.followUp < today()
                  : group === 'Due today'
                    ? p.followUp === today()
                    : p.followUp > today()),
            )
            .sort((a, b) => a.followUp.localeCompare(b.followUp));
          return (
            <section className="follow-group" key={group}>
              <p className="eyebrow">
                {group.toUpperCase()} <span>{list.length}</span>
              </p>
              {list.map((p) => (
                <button
                  className="follow-person"
                  key={p.id}
                  onClick={() => onOpen(p.id)}
                >
                  <Avatar name={p.name} url={p.profileImage} />
                  <span>
                    <b>{p.name}</b>
                    <small>{p.company}</small>
                    <small className={group === 'Overdue' ? 'overdue' : ''}>
                      {group === 'Overdue'
                        ? `${daysSince(p.followUp)} days overdue`
                        : `Follow up ${fmt(p.followUp)}`}
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {!list.length && (
                <p className="muted">No {group.toLowerCase()} follow-ups.</p>
              )}
            </section>
          );
        })}
      </SheetContent>
    </Sheet>
  );
}
export function SettingsPanel({
  data,
  onImport,
  onClose,
}: {
  data: Network;
  onImport: (d: Network) => void;
  onClose: () => void;
}) {
  const [sharingUsage, setSharingUsage] = useState(usageEnabled);
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/analytics/access', { signal: c.signal, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsOwner(!!(d as { owner?: boolean } | null)?.owner))
      .catch(() => {});
    return () => c.abort();
  }, []);
  const ref = useRef<HTMLInputElement>(null),
    [error, setError] = useState('');
  return (
    <Modal
      title="Workspace settings"
      description="Your network belongs to you."
      onClose={onClose}
    >
      <div className="settings-block">
        <h3>Storage & backups</h3>
        <p className="muted">
          Your workspace saves automatically in this browser. Export a backup to
          move it to another device or keep a safe copy.
        </p>
        <div className="settings-actions">
          <button onClick={() => repository.export(data)}>
            <Download size={17} />
            Export Data
          </button>
          <button onClick={() => ref.current?.click()}>
            <Upload size={17} />
            Import Data
          </button>
        </div>
        <input
          hidden
          ref={ref}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 20 * 1024 * 1024)
                throw Error('Choose a JSON file smaller than 20 MB.');
              const d = validateNetwork(JSON.parse(await file.text()));
              onImport(d);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Could not import this file.',
              );
            }
            e.target.value = '';
          }}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="settings-block">
        <h3>Keyboard shortcuts</h3>
        <div className="shortcut-grid">
          {[
            ['N', 'New connection'],
            ['T', 'New text node'],
            ['Ctrl / ⌘ F', 'Search network'],
            ['Delete', 'Delete selected nodes'],
            ['Ctrl / ⌘ Z', 'Undo'],
            ['Ctrl / ⌘ Shift Z', 'Redo'],
            ['Escape', 'Close / cancel'],
          ].map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-block">
        <div className="analytics-setting">
          <label htmlFor="share-usage">Share basic usage statistics</label>
          <Switch
            id="share-usage"
            checked={sharingUsage}
            onCheckedChange={(v) => {
              setUsageEnabled(v);
              setSharingUsage(usageEnabled());
            }}
          />
        </div>
        <p className="muted">
          Help improve ConnectKon with visitor counts and feature usage. Contact
          details and conversations are never sent. Random browser identifiers
          and events are kept for up to 90 days. Browser privacy signals are
          respected.
        </p>
      </div>
      {isOwner && (
        <a className="button" href="/admin">
          View site analytics ↗
        </a>
      )}
      <p className="muted">ConnectKon · Personal workspace · Dark appearance</p>
    </Modal>
  );
}
