import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  blankPerson,
  canonicalUrl,
  today,
  uid,
  type Person,
  type Conversation,
  type Relationship,
  type TextNode,
} from '@/lib/network';
import { Modal, Field, Choice, Strength } from './UI';
const split = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
export function PersonForm({
  person,
  people,
  onSave,
  onClose,
  onOpen,
}: {
  person?: Person;
  people: Person[];
  onSave: (p: Person) => void;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const [p, setP] = useState<Person>(() => person || blankPerson()),
    [error, setError] = useState(''),
    [duplicate, setDuplicate] = useState('');
  const set = (key: keyof Person, value: unknown) =>
    setP({ ...p, [key]: value });
  return (
    <Modal
      title={person ? 'Edit connection' : 'Add a connection'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const url = canonicalUrl(p.linkedinUrl);
          if (!p.name.trim() || !url) {
            setError(
              'Enter a name and a valid https://www.linkedin.com/in/ profile URL.',
            );
            return;
          }
          const match = people.find(
            (x) => x.id !== p.id && canonicalUrl(x.linkedinUrl) === url,
          );
          if (match) {
            setError('This LinkedIn connection already exists.');
            setDuplicate(match.id);
            return;
          }
          onSave({
            ...p,
            name: p.name.trim(),
            linkedinUrl: url,
            updatedAt: new Date().toISOString(),
          });
        }}
      >
        <div className="form-grid">
          <Field label="Full name *">
            <input
              autoFocus
              required
              value={p.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Isaac Lee"
            />
          </Field>
          <Field label="LinkedIn URL *">
            <input
              type="url"
              required
              value={p.linkedinUrl}
              onChange={(e) => set('linkedinUrl', e.target.value)}
              placeholder="https://www.linkedin.com/in/…"
            />
          </Field>
          <Field label="Current company">
            <input
              value={p.company}
              onChange={(e) => set('company', e.target.value)}
            />
          </Field>
          <Field label="Current position">
            <input
              value={p.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </Field>
          <Field label="Industry">
            <input
              value={p.industry}
              onChange={(e) => set('industry', e.target.value)}
            />
          </Field>
          <Field label="Profile image URL">
            <input
              type="url"
              value={p.profileImage}
              onChange={(e) => set('profileImage', e.target.value)}
            />
          </Field>
          <div className="field">
            <span>Relationship strength</span>
            <Strength value={p.strength} onChange={(v) => set('strength', v)} />
          </div>
          <Choice
            label="Priority"
            value={p.priority}
            options={['Low', 'Normal', 'High']}
            onChange={(v) => set('priority', v)}
          />
          <Field label="How we met">
            <input
              value={p.howWeMet}
              onChange={(e) => set('howWeMet', e.target.value)}
            />
          </Field>
          <label className="university-checkbox wide">
            <Checkbox
              checked={!!p.sameUniversity}
              onCheckedChange={(checked) => set('sameUniversity', !!checked)}
            />
            <span>Same university as me</span>
          </label>
          <Field label="Reason for connecting">
            <input
              value={p.reason}
              onChange={(e) => set('reason', e.target.value)}
            />
          </Field>
          <Field label="Last interaction">
            <input
              type="date"
              value={p.lastContact}
              onChange={(e) => set('lastContact', e.target.value)}
            />
          </Field>
          <Field label="Next follow-up">
            <input
              type="date"
              value={p.followUp}
              onChange={(e) => set('followUp', e.target.value)}
            />
          </Field>
          <Field label="Prior conversations (not logged)">
            <input
              type="number"
              min="0"
              max="100000"
              value={p.initialCount}
              onChange={(e) => set('initialCount', Number(e.target.value))}
            />
          </Field>
          <Field label="Tags · comma-separated">
            <input
              defaultValue={p.tags.join(', ')}
              onChange={(e) => set('tags', split(e.target.value))}
              placeholder="Alumni, Mentor, Recruiting"
            />
          </Field>
          <Field label="General notes" wide>
            <textarea
              value={p.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {duplicate && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpen(duplicate);
            }}
          >
            Open Existing Connection
          </button>
        )}
        <div className="form-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            {person ? 'Save changes' : 'Add to network'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ConversationForm({
  connectionId,
  conversation,
  onSave,
  onClose,
}: {
  connectionId: string;
  conversation?: Conversation;
  onSave: (c: Conversation) => void;
  onClose: () => void;
}) {
  const [c, setC] = useState<Conversation>(
    () =>
      conversation || {
        id: uid(),
        connectionId,
        date: today(),
        type: 'Coffee Chat',
        topics: [],
        summary: '',
        takeaways: '',
        actions: [],
        followUp: '',
        privateNotes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
  );
  const set = (key: keyof Conversation, value: unknown) =>
    setC({ ...c, [key]: value });
  return (
    <Modal
      title={conversation ? 'Edit conversation' : 'Add a conversation'}
      description="Turn a good conversation into a lasting connection."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...c,
            actions: c.actions.filter((a) => a.text.trim()),
            updatedAt: new Date().toISOString(),
          });
        }}
      >
        <div className="form-grid">
          <Field label="Date *">
            <input
              type="date"
              required
              value={c.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Choice
            label="Interaction type"
            value={c.type}
            options={[
              'Coffee Chat',
              'Phone Call',
              'Zoom',
              'LinkedIn Message',
              'Email',
              'In Person',
              'Event',
              'Interview',
              'Other',
            ]}
            onChange={(v) => set('type', v)}
          />
          <Field label="Core topics · comma-separated" wide>
            <input
              defaultValue={c.topics.join(', ')}
              onChange={(e) => set('topics', split(e.target.value))}
              placeholder="Career advice, Recruiting, UWIG"
            />
          </Field>
          <Field label="Conversation summary *" wide>
            <textarea
              required
              value={c.summary}
              onChange={(e) => set('summary', e.target.value)}
              placeholder="What did you talk about?"
            />
          </Field>
          <Field label="Key takeaways" wide>
            <textarea
              value={c.takeaways}
              onChange={(e) => set('takeaways', e.target.value)}
              placeholder="What would you like to remember?"
            />
          </Field>
          <div className="field wide">
            <span>Action items</span>
            {c.actions.map((a) => (
              <div className="action-edit" key={a.id}>
                <Checkbox
                  aria-label="Completed"
                  checked={a.completed}
                  onCheckedChange={(v) =>
                    set(
                      'actions',
                      c.actions.map((x) =>
                        x.id === a.id ? { ...x, completed: !!v } : x,
                      ),
                    )
                  }
                />
                <input
                  aria-label="Action item"
                  value={a.text}
                  onChange={(e) =>
                    set(
                      'actions',
                      c.actions.map((x) =>
                        x.id === a.id ? { ...x, text: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  aria-label="Remove action"
                  onClick={() =>
                    set(
                      'actions',
                      c.actions.filter((x) => x.id !== a.id),
                    )
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="subtle"
              onClick={() =>
                set('actions', [
                  ...c.actions,
                  { id: uid(), text: '', completed: false },
                ])
              }
            >
              <Plus size={16} />
              Add action item
            </button>
          </div>
          <Field label="Next follow-up">
            <input
              type="date"
              value={c.followUp}
              onChange={(e) => set('followUp', e.target.value)}
            />
          </Field>
          <Field label="Private notes" wide>
            <textarea
              value={c.privateNotes}
              onChange={(e) => set('privateNotes', e.target.value)}
            />
          </Field>
        </div>
        <div className="form-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save conversation
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function EdgeForm({
  edge,
  onSave,
  onDelete,
  onClose,
}: {
  edge: Relationship;
  onSave: (e: Relationship) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [r, setR] = useState(edge);
  return (
    <Modal title="Relationship" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(r);
        }}
      >
        <div className="form-grid">
          <Choice
            label="Relationship type"
            value={r.type}
            options={[
              'Introduced me to',
              'Coworker',
              'Same University',
              'Same Club',
              'Friend',
              'Mentor',
              'Met at Event',
              'Professional Connection',
              'Other',
            ]}
            onChange={(v) => setR({ ...r, type: v })}
          />
          <Field label="Line label">
            <input
              value={r.label}
              onChange={(e) => setR({ ...r, label: e.target.value })}
            />
          </Field>
          <Field label="Notes" wide>
            <textarea
              value={r.notes}
              onChange={(e) => setR({ ...r, notes: e.target.value })}
            />
          </Field>
        </div>
        <div className="form-footer">
          <button type="button" className="danger" onClick={onDelete}>
            Delete relationship
          </button>
          <button className="primary">Save relationship</button>
        </div>
      </form>
    </Modal>
  );
}
export function TextForm({
  node,
  onSave,
  onDelete,
  onClose,
}: {
  node: TextNode;
  onSave: (t: TextNode) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(node.text);
  return (
    <Modal title="Canvas text" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...node, text });
        }}
      >
        <Field label="Text">
          <textarea
            autoFocus
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A category, a reminder, a thought…"
          />
        </Field>
        <div className="form-footer">
          <button type="button" className="danger" onClick={onDelete}>
            Delete
          </button>
          <button className="primary">Save text</button>
        </div>
      </form>
    </Modal>
  );
}
