import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Calendar,
  Search,
  Coffee,
  Clock,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  type Network,
  type Person,
  type Conversation,
  conversationsFor,
  lastContact,
  fmt,
  daysSince,
} from '@/lib/network';
import { Avatar, Strength, Field } from './UI';
import { trackUsage } from '@/lib/analytics-client';
export function Workspace({
  data,
  person,
  onBack,
  onEdit,
  onDelete,
  onConversation,
  onDeleteConversation,
  update,
}: {
  data: Network;
  person: Person;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConversation: (c?: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  update: (f: (d: Network) => Network) => void;
}) {
  const [search, setSearch] = useState('');
  const all = conversationsFor(data, person.id),
    last = lastContact(data, person),
    first = [person.lastContact, ...all.map((c) => c.date)]
      .filter(Boolean)
      .sort()[0];
  const list = all.filter((c) =>
    JSON.stringify([
      c.summary,
      c.takeaways,
      c.topics,
      c.actions,
      c.privateNotes,
    ])
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const edit = (key: keyof Person, value: unknown) => {
    if (key === 'followUp' && value && value !== person.followUp)
      trackUsage('followup_set');
    update((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.id === person.id
          ? { ...p, [key]: value, updatedAt: new Date().toISOString() }
          : p,
      ),
    }));
  };
  return (
    <main className="workspace">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to Network Map
      </button>
      <div className="profile-heading">
        <Avatar name={person.name} url={person.profileImage} large />
        <div className="profile-name">
          <p className="eyebrow">CONNECTION WORKSPACE</p>
          <h1>{person.name}</h1>
          <p>
            {person.role || 'Position not added'}{' '}
            <span className="muted">at</span>{' '}
            {person.company || 'Company not added'}
          </p>
          <div className="tags">
            <span className="muted">{person.industry}</span>
            {person.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="profile-buttons">
          <a
            className="button"
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open LinkedIn
            <ArrowUpRight size={15} />
          </a>
          <button onClick={onEdit}>
            <Pencil size={15} />
            Edit
          </button>
          <button aria-label="Delete connection" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="workspace-grid">
        <aside>
          <section className="info-panel">
            <p className="eyebrow">RELATIONSHIP</p>
            <label className="university-checkbox">
              <Checkbox
                checked={!!person.sameUniversity}
                onCheckedChange={(checked) => edit('sameUniversity', !!checked)}
              />
              <span>Same university as me</span>
            </label>
            <div className="summary-row">
              <span>Strength</span>
              <Strength
                value={person.strength}
                onChange={(v) => edit('strength', v)}
              />
            </div>
            <div className="summary-row">
              <span>Met through</span>
              <b>{person.howWeMet || 'Not added'}</b>
            </div>
            <div className="summary-row">
              <span>Reason</span>
              <b>{person.reason || 'Not added'}</b>
            </div>
            <div className="summary-row">
              <span>Priority</span>
              <b>{person.priority}</b>
            </div>
            <hr />
            <div className="summary-row">
              <span>Total interactions</span>
              <b>{all.length + person.initialCount}</b>
            </div>
            <div className="summary-row">
              <span>First contact</span>
              <b>{fmt(first)}</b>
            </div>
            <div className="summary-row">
              <span>Last contact</span>
              <b>{fmt(last)}</b>
            </div>
            <div className="summary-row">
              <span>Since last contact</span>
              <b>{last ? `${daysSince(last)} days` : 'Not recorded'}</b>
            </div>
          </section>
          <section className="info-panel follow-panel">
            <div className="section-title">
              <Calendar size={17} />
              <h3>Next follow-up</h3>
            </div>
            <Field label="Follow-up date">
              <input
                type="date"
                value={person.followUp}
                onChange={(e) => edit('followUp', e.target.value)}
              />
            </Field>
            {person.followUp && (
              <p className="muted">
                {daysSince(person.followUp) > 0
                  ? `${daysSince(person.followUp)} days overdue`
                  : daysSince(person.followUp) === 0
                    ? 'Due today'
                    : `In ${-daysSince(person.followUp)} days`}
              </p>
            )}
          </section>
          <section className="info-panel">
            <Field label="General notes">
              <textarea
                key={person.id}
                defaultValue={person.notes}
                onBlur={(e) => {
                  if (e.target.value !== person.notes)
                    edit('notes', e.target.value);
                }}
                placeholder="The details worth remembering…"
              />
            </Field>
          </section>
        </aside>
        <article>
          <section className="next-conversation">
            <div className="section-title">
              <MessageSquare size={18} />
              <h3>Next conversation</h3>
              <span>Make the next hello count.</span>
            </div>
            <textarea
              aria-label="Next conversation"
              key={person.id}
              defaultValue={person.nextConversation}
              onBlur={(e) => {
                if (e.target.value !== person.nextConversation)
                  edit('nextConversation', e.target.value);
              }}
              placeholder="What would you like to talk about next?"
            />
          </section>
          <div className="history-heading">
            <div>
              <h2>
                Conversation history <span className="count">{all.length}</span>
              </h2>
              <p className="muted">
                Your relationship, one conversation at a time.
              </p>
            </div>
            <button className="primary" onClick={() => onConversation()}>
              <Plus size={17} />
              Add Conversation
            </button>
          </div>
          <div className="searchbox history-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, takeaways, notes…"
              aria-label="Search conversation history"
            />
          </div>
          <div className="timeline">
            {list.map((c) => (
              <section className="conversation" key={c.id}>
                <div className="timeline-dot" />
                <div className="conversation-top">
                  <div className="section-title">
                    <Coffee size={18} />
                    <h3>{c.type}</h3>
                  </div>
                  <time>
                    {fmt(c.date)}, {c.date.slice(0, 4)}
                  </time>
                </div>
                <div className="tags">
                  {c.topics.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <p className="conversation-summary">{c.summary}</p>
                {c.takeaways && (
                  <div className="takeaway">
                    <p className="eyebrow">KEY TAKEAWAYS</p>
                    <p>{c.takeaways}</p>
                  </div>
                )}
                {c.actions.length > 0 && (
                  <div className="action-list">
                    <p className="eyebrow">ACTION ITEMS</p>
                    {c.actions.map((a) => (
                      <label
                        className={'action ' + (a.completed ? 'completed' : '')}
                        key={a.id}
                      >
                        <Checkbox
                          checked={a.completed}
                          onCheckedChange={(v) =>
                            update((d) => ({
                              ...d,
                              conversations: d.conversations.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      actions: x.actions.map((b) =>
                                        b.id === a.id
                                          ? { ...b, completed: !!v }
                                          : b,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                        />
                        <span>{a.text}</span>
                      </label>
                    ))}
                  </div>
                )}
                {c.privateNotes && (
                  <details>
                    <summary>Private notes</summary>
                    <p>{c.privateNotes}</p>
                  </details>
                )}
                {c.followUp && (
                  <p className="muted">
                    <Clock size={13} /> Follow-up recorded: {fmt(c.followUp)}
                  </p>
                )}
                <div className="conversation-actions">
                  <button onClick={() => onConversation(c)}>
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button onClick={() => onDeleteConversation(c.id)}>
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </section>
            ))}
          </div>
          {!list.length && (
            <div className="history-empty">
              <MessageSquare size={28} />
              <h3>
                {search
                  ? 'No matching conversations'
                  : 'Every relationship has a story.'}
              </h3>
              <p>
                {search
                  ? 'Try another topic or keyword.'
                  : 'Record your first conversation to start the timeline.'}
              </p>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
