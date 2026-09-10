'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Network as NetworkIcon,
  Plus,
  Search,
  Settings,
  Bell,
  SlidersHorizontal,
  Check,
  ArrowUpRight,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useNetwork } from '@/hooks/use-network';
import { trackUsage } from '@/lib/analytics-client';
import {
  blankPerson,
  demoNetwork,
  uid,
  today,
  daysSince,
  lastContact,
  type Person,
  type Conversation,
  type TextNode,
  type Network,
} from '@/lib/network';
import { Canvas } from './Canvas';
import { Workspace } from './Workspace';
import { PersonForm, ConversationForm, EdgeForm, TextForm } from './Forms';
import { Confirm, Modal, Choice, Avatar } from './UI';
import { FilterPanel, Followups, SettingsPanel, noFilters } from './Panels';
export default function App() {
  useEffect(() => {
    trackUsage('visit');
  }, []);
  const store = useNetwork(),
    { data, update } = store;
  const [personId, setPersonId] = useState<string | null>(null),
    [form, setForm] = useState<
      | 'person'
      | 'conversation'
      | 'filters'
      | 'settings'
      | 'followups'
      | 'connect'
      | null
    >(null),
    [editing, setEditing] = useState<Person | undefined>(),
    [conversation, setConversation] = useState<Conversation | undefined>(),
    [text, setText] = useState<TextNode | null>(null),
    [edgeId, setEdgeId] = useState<string | null>(null),
    [query, setQuery] = useState(''),
    [filters, setFilters] = useState(noFilters),
    [focusId, setFocusId] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState<{
      title: string;
      description: string;
      action: () => void;
    } | null>(null),
    [context, setContext] = useState<{
      x: number;
      y: number;
      id?: string;
    } | null>(null),
    [connectSource, setConnectSource] = useState(''),
    [connectTarget, setConnectTarget] = useState('');
  const [selectAllTick, setSelectAllTick] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const person = data.people.find((p) => p.id === personId),
    edge = data.relationships.find((e) => e.id === edgeId);
  const close = () => {
    setForm(null);
    setText(null);
    setEdgeId(null);
    setContext(null);
  };
  useEffect(() => {
    const route = () =>
      setPersonId(
        decodeURIComponent(location.hash.replace('#connection/', '')) || null,
      );
    route();
    window.addEventListener('hashchange', route);
    return () => window.removeEventListener('hashchange', route);
  }, []);
  const open = (id: string) => {
    setPersonId(id);
    location.hash = 'connection/' + id;
    setForm(null);
    setQuery('');
  };
  const back = () => {
    setPersonId(null);
    setFocusId(null);
    history.replaceState(null, '', location.pathname + location.search);
  };
  const add = () => {
    setEditing(undefined);
    setForm('person');
  };
  const addText = (pos?: { x: number; y: number }) => {
    setText({
      id: uid(),
      text: '',
      position: pos || {
        x: (window.innerWidth / 2 - data.viewport.x) / data.viewport.zoom,
        y: (window.innerHeight / 2 - 76 - data.viewport.y) / data.viewport.zoom,
      },
      width: 280,
      height: 100,
    });
  };
  const deleteNodes = (ids: string[]) => {
    if (!ids.length) return;
    const names = data.people.filter((p) => ids.includes(p.id));
    setConfirm({
      title:
        names.length === 1
          ? `Delete ${names[0].name}?`
          : `Delete ${ids.length} selected nodes?`,
      description:
        'All conversation history and relationship lines associated with these connections will also be deleted. You can undo this canvas change.',
      action: () => {
        update((d) => ({
          ...d,
          people: d.people.filter((p) => !ids.includes(p.id)),
          conversations: d.conversations.filter(
            (c) => !ids.includes(c.connectionId),
          ),
          relationships: d.relationships.filter(
            (e) => !ids.includes(e.source) && !ids.includes(e.target),
          ),
          texts: d.texts.filter((t) => !ids.includes(t.id)),
        }));
        if (personId && ids.includes(personId)) back();
        setSelected([]);
        close();
      },
    });
  };
  const connect = (source: string, target: string) => {
    if (
      source === target ||
      data.relationships.some((e) => e.source === source && e.target === target)
    )
      return;
    const id = uid();
    update((d) => ({
      ...d,
      relationships: [
        ...d.relationships,
        {
          id,
          source,
          target,
          type: 'Professional Connection',
          label: '',
          notes: '',
        },
      ],
    }));
    setForm(null);
    setEdgeId(id);
    trackUsage('relationship_created');
  };
  const savePerson = (p: Person) => {
    const exists = data.people.some((x) => x.id === p.id);
    const final = exists
      ? p
      : {
          ...p,
          position: {
            x:
              (window.innerWidth / 2 - data.viewport.x - 135) /
              data.viewport.zoom,
            y:
              (window.innerHeight / 2 - 76 - data.viewport.y) /
              data.viewport.zoom,
          },
        };
    update((d) => ({
      ...d,
      people: exists
        ? d.people.map((x) => (x.id === p.id ? final : x))
        : [...d.people, final],
    }));
    close();
    setFocusId(p.id);
    if (!exists) trackUsage('connection_created');
    if (
      p.followUp &&
      p.followUp !== data.people.find((x) => x.id === p.id)?.followUp
    )
      trackUsage('followup_set');
  };
  const saveConversation = (c: Conversation) => {
    const isNew = !data.conversations.some((x) => x.id === c.id);
    update((d) => ({
      ...d,
      conversations: d.conversations.some((x) => x.id === c.id)
        ? d.conversations.map((x) => (x.id === c.id ? c : x))
        : [...d.conversations, c],
      people: d.people.map((p) =>
        p.id === c.connectionId
          ? {
              ...p,
              followUp: c.followUp || p.followUp,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    }));
    close();
    if (isNew) trackUsage('conversation_created');
    if (
      c.followUp &&
      c.followUp !== data.people.find((p) => p.id === c.connectionId)?.followUp
    )
      trackUsage('followup_set');
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest(
          'input,textarea,select,[contenteditable=true],[role=combobox]',
        )
      )
        return;
      if (e.key === 'Escape') {
        close();
        setQuery('');
        return;
      }
      if (form || text || edgeId || confirm) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? store.redo() : store.undo();
      } else if (!mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        add();
      } else if (!mod && e.key.toLowerCase() === 't' && !person) {
        e.preventDefault();
        addText();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !person) {
        e.preventDefault();
        deleteNodes(selected);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, form, text, edgeId, confirm, selected, person]);
  useEffect(() => {
    const ctx = (document as any).modelContext;
    if (!ctx?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: 'start_connection_creation',
          title: 'Add a connection',
          description:
            'Open the Add Connection form. This does not save a connection.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof input !== 'object' ||
              Object.keys(input).length
            )
              throw Error('Expected an empty object.');
            setEditing(undefined);
            setForm('person');
            return { status: 'form_opened' };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  const results = useMemo(
    () =>
      query.trim()
        ? data.people
            .filter((p) =>
              JSON.stringify([
                p.name,
                p.company,
                p.role,
                p.industry,
                p.tags,
                p.notes,
                ...data.conversations
                  .filter((c) => c.connectionId === p.id)
                  .map((c) => [c.summary, c.topics, c.takeaways]),
              ])
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 12)
        : [],
    [query, data.people, data.conversations],
  );
  const visibleIds = useMemo(
    () =>
      new Set(
        data.people
          .filter((p) => {
            const age = daysSince(lastContact(data, p));
            return (
              (filters.strength === 'Any strength' ||
                p.strength >= parseInt(filters.strength)) &&
              (filters.company === 'All companies' ||
                p.company === filters.company) &&
              (filters.industry === 'All industries' ||
                p.industry === filters.industry) &&
              (filters.tag === 'All tags' || p.tags.includes(filters.tag)) &&
              (filters.last === 'Any time' ||
                (filters.last.startsWith('Last')
                  ? age <= parseInt(filters.last.split(' ')[1])
                  : age > parseInt(filters.last.split(' ')[2]))) &&
              (filters.follow === 'Any follow-up' ||
                (filters.follow === 'No follow-up'
                  ? !p.followUp
                  : filters.follow === 'Overdue'
                    ? !!p.followUp && p.followUp < today()
                    : !!p.followUp &&
                      daysSince(p.followUp) <= 0 &&
                      daysSince(p.followUp) >= -7))
            );
          })
          .map((p) => p.id),
      ),
    [data.people, data.conversations, filters],
  );
  const filterCount = Object.keys(filters).filter(
    (k) => (filters as any)[k] !== (noFilters as any)[k],
  ).length;
  const due = data.people.filter(
    (p) => p.followUp && p.followUp <= today(),
  ).length;
  const contextPerson = data.people.find((p) => p.id === context?.id),
    contextText = data.texts.find((t) => t.id === context?.id);
  return (
    <div className="app dark">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            back();
          }}
        >
          <NetworkIcon size={25} />
          <span>
            ConnectKon<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="global-search">
          <div className="searchbox">
            <Search size={17} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your network…"
              aria-label="Search your network"
            />
            <kbd>⌘ F</kbd>
          </div>
          {query && (
            <div className="search-results">
              <div className="search-result-caption">
                {results.length} CONNECTIONS · CLICK TO FOCUS
              </div>
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (focusId === p.id) open(p.id);
                    else {
                      back();
                      setFilters(noFilters);
                      setFocusId(p.id);
                    }
                  }}
                >
                  <Avatar name={p.name} url={p.profileImage} />
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {p.company} · {p.role}
                    </small>
                  </span>
                  {focusId === p.id ? (
                    <span className="tag">Open workspace</span>
                  ) : (
                    <ArrowUpRight size={15} />
                  )}
                </button>
              ))}
              {!results.length && (
                <p>No connections found. Try a name, company, or topic.</p>
              )}
              <button className="search-dismiss" onClick={() => setQuery('')}>
                Close search <X size={13} />
              </button>
            </div>
          )}
        </div>
        <button className="follow-nav" onClick={() => setForm('followups')}>
          <Bell size={17} />
          Follow-ups{due > 0 && <span className="badge">{due}</span>}
        </button>
        <button
          className="icon-button"
          aria-label="Settings"
          onClick={() => setForm('settings')}
        >
          <Settings size={19} />
        </button>
        <button className="primary" onClick={add}>
          <Plus size={17} />
          <span>Add Connection</span>
        </button>
        <span className="avatar" title="Personal workspace">
          ME
        </span>
      </header>
      {person ? (
        <Workspace
          data={data}
          person={person}
          onBack={back}
          onEdit={() => {
            setEditing(person);
            setForm('person');
          }}
          onDelete={() => deleteNodes([person.id])}
          onConversation={(c) => {
            setConversation(c);
            setForm('conversation');
          }}
          onDeleteConversation={(id) =>
            setConfirm({
              title: 'Delete this conversation?',
              description:
                'This conversation and its action items will be removed.',
              action: () =>
                update((d) => ({
                  ...d,
                  conversations: d.conversations.filter((c) => c.id !== id),
                })),
            })
          }
          update={update}
        />
      ) : (
        <>
          <div className="map-heading">
            <div>
              <p className="eyebrow">PERSONAL WORKSPACE</p>
              <h1>
                My network <span className="count">{data.people.length}</span>
              </h1>
              <p className="muted">
                Good relationships start with a connection.
              </p>
            </div>
            <div className="map-actions">
              <span className="saved" role="status">
                <Check size={13} />
                {store.status}
              </span>
              <button onClick={() => setForm('filters')}>
                <SlidersHorizontal size={15} />
                Filters
                {filterCount > 0 && (
                  <span className="badge">{filterCount}</span>
                )}
              </button>
            </div>
          </div>
          {filterCount > 0 && (
            <div className="filter-status">
              Showing {visibleIds.size} of {data.people.length} connections
              <button onClick={() => setFilters(noFilters)}>
                Clear filters
                <X size={12} />
              </button>
            </div>
          )}
          {store.ready && (
            <Canvas
              data={data}
              selectAllTick={selectAllTick}
              visibleIds={visibleIds}
              update={update}
              open={open}
              add={add}
              addText={addText}
              editText={setText}
              editEdge={setEdgeId}
              connect={connect}
              focusId={focusId}
              onSelect={setSelected}
              context={(e, id) => {
                e.preventDefault();
                setContext({ x: e.clientX, y: e.clientY, id });
              }}
              undo={store.undo}
              redo={store.redo}
              canUndo={store.canUndo}
              canRedo={store.canRedo}
              loadDemo={() => store.replace(demoNetwork())}
            />
          )}
          <div className="network-summary">
            <span>
              <b>{data.people.length}</b> connections
            </span>
            <i />
            <span>
              <b>{data.people.filter((p) => p.strength >= 4).length}</b> strong
              relationships
            </span>
            <i />
            <span>
              <b>
                {
                  new Set(data.people.map((p) => p.company).filter(Boolean))
                    .size
                }
              </b>{' '}
              companies
            </span>
          </div>
        </>
      )}
      {form === 'person' && (
        <PersonForm
          key={editing?.id || 'new'}
          person={editing}
          people={data.people}
          onSave={savePerson}
          onClose={close}
          onOpen={open}
        />
      )}
      {form === 'conversation' && person && (
        <ConversationForm
          connectionId={person.id}
          conversation={conversation}
          onSave={saveConversation}
          onClose={close}
        />
      )}
      {form === 'filters' && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          people={data.people}
          onClose={close}
        />
      )}
      {form === 'followups' && (
        <Followups
          people={data.people}
          onOpen={(id) => {
            setFilters(noFilters);
            open(id);
          }}
          onClose={close}
        />
      )}
      {form === 'settings' && (
        <SettingsPanel
          data={data}
          onClose={close}
          onImport={(d) =>
            setConfirm({
              title: 'Replace your workspace?',
              description: `Import ${d.people.length} connections and ${d.conversations.length} conversations? This replaces all current workspace data. Export a backup first if needed.`,
              action: () => {
                store.replace(d);
                back();
                close();
              },
            })
          }
        />
      )}
      {edge && (
        <EdgeForm
          edge={edge}
          onClose={close}
          onSave={(r) => {
            update((d) => ({
              ...d,
              relationships: d.relationships.map((e) =>
                e.id === r.id ? r : e,
              ),
            }));
            close();
          }}
          onDelete={() => {
            update((d) => ({
              ...d,
              relationships: d.relationships.filter((e) => e.id !== edge.id),
            }));
            close();
          }}
        />
      )}
      {text && (
        <TextForm
          node={text}
          onClose={close}
          onSave={(t) => {
            update((d) => ({
              ...d,
              texts: d.texts.some((x) => x.id === t.id)
                ? d.texts.map((x) => (x.id === t.id ? t : x))
                : [...d.texts, t],
            }));
            close();
          }}
          onDelete={() => {
            update((d) => ({
              ...d,
              texts: d.texts.filter((t) => t.id !== text.id),
            }));
            close();
          }}
        />
      )}
      {confirm && (
        <Confirm
          title={confirm.title}
          description={confirm.description}
          onConfirm={confirm.action}
          onClose={() => setConfirm(null)}
        />
      )}
      {form === 'connect' && (
        <Modal title="Connect two people" onClose={close}>
          <Choice
            label="Connect to"
            value={connectTarget}
            options={data.people
              .filter((p) => p.id !== connectSource)
              .map((p) => `${p.name} · ${p.id}`)}
            onChange={setConnectTarget}
          />
          <div className="form-footer">
            <button
              className="primary"
              disabled={!connectTarget}
              onClick={() =>
                connect(connectSource, connectTarget.split(' · ').at(-1)!)
              }
            >
              Create relationship
            </button>
          </div>
        </Modal>
      )}
      {context && (
        <DropdownMenu
          open
          onOpenChange={(v) => {
            if (!v) setContext(null);
          }}
        >
          <DropdownMenuTrigger
            style={{
              position: 'fixed',
              left: context.x,
              top: context.y,
              width: 1,
              height: 1,
              padding: 0,
              opacity: 0,
            }}
            aria-label="Canvas actions"
          />
          <DropdownMenuContent className="context-menu">
            {contextPerson ? (
              <>
                <DropdownMenuItem onClick={() => open(contextPerson.id)}>
                  Open workspace
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(contextPerson);
                    setForm('person');
                  }}
                >
                  Edit connection
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setConnectSource(contextPerson.id);
                    setConnectTarget('');
                    setForm('connect');
                  }}
                >
                  Connect to…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing({
                      ...contextPerson,
                      id: uid(),
                      name: contextPerson.name + ' (copy)',
                      linkedinUrl: '',
                    });
                    setForm('person');
                  }}
                >
                  Duplicate details…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteNodes([contextPerson.id])}
                >
                  Delete connection
                </DropdownMenuItem>
              </>
            ) : contextText ? (
              <>
                <DropdownMenuItem onClick={() => setText(contextText)}>
                  Edit text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteNodes([contextText.id])}>
                  Delete text
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={add}>
                  Add Connection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addText()}>
                  Add Text
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectAllTick((v) => v + 1)}
                >
                  Select All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    let value = '';
                    try {
                      value = await navigator.clipboard.readText();
                    } catch {}
                    setText({
                      id: uid(),
                      text: value,
                      position: { x: 100, y: 100 },
                      width: 280,
                      height: 120,
                    });
                  }}
                >
                  Paste text
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteNodes(selected)}
                  disabled={!selected.length}
                >
                  Delete selected ({selected.length})
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
