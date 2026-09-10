import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeResizer,
  applyNodeChanges,
  useReactFlow,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  MousePointer2,
  Hand,
  Type,
  Undo2,
  Redo2,
  Link2,
  Network as NetworkIcon,
  Plus,
  ArrowUpRight,
  RotateCcw,
  Star,
} from 'lucide-react';
import {
  type Network,
  type Person,
  type TextNode,
  fmt,
  lastContact,
} from '@/lib/network';
import { Avatar, Strength } from './UI';
const PersonNode = memo(function PersonNode({ data, selected }: NodeProps) {
  const p = data.person as Person;
  return (
    <div className={'connection-card ' + (selected ? 'is-selected' : '')}>
      {p.sameUniversity && (
        <span
          className="university-star"
          role="img"
          aria-label="Same university as you"
          title="Same university as you"
        >
          <Star size={15} fill="currentColor" aria-hidden="true" />
        </span>
      )}
      <Handle type="target" position={Position.Left} />
      <div className="card-profile">
        <Avatar name={p.name} url={p.profileImage} />
        <div>
          <h3>{p.name}</h3>
          <p>{p.role || 'Position not added'}</p>
        </div>
        <ArrowUpRight className="card-arrow" size={14} />
      </div>
      <div className="card-company">
        {p.company || 'Independent connection'}
      </div>
      <div className="card-meta">
        <Strength value={p.strength} />
        <span className="tag">{p.tags[0] || p.industry || 'Connection'}</span>
      </div>
      <div className="card-footer">
        <span>
          Last contact <b>{fmt(data.last as string)}</b>
        </span>
        {p.followUp && (
          <span className="follow-dot" title={`Follow up ${p.followUp}`}>
            ↗ {fmt(p.followUp)}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
const NoteNode = memo(function NoteNode({ data, selected }: NodeProps) {
  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={45}
        isVisible={selected}
        onResizeEnd={(_, v) => (data.resize as any)(v.width, v.height)}
      />
      <div className="text-node">{data.text as string}</div>
    </>
  );
});
const nodeTypes = { person: PersonNode, note: NoteNode };
type Props = {
  data: Network;
  selectAllTick: number;
  visibleIds: Set<string>;
  update: (fn: (d: Network) => Network, record?: boolean) => void;
  open: (id: string) => void;
  add: () => void;
  addText: (pos?: { x: number; y: number }) => void;
  editText: (t: TextNode) => void;
  editEdge: (id: string) => void;
  connect: (source: string, target: string) => void;
  focusId: string | null;
  onSelect: (ids: string[]) => void;
  context: (event: React.MouseEvent, id?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  loadDemo: () => void;
};
export function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  );
}
function Board(p: Props) {
  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => p.onSelect(nodes.map((n) => n.id)),
    [p.onSelect],
  );
  const flow = useReactFlow(),
    [hand, setHand] = useState(false);
  const toNodes = () => [
    ...p.data.people.map((person) => ({
      id: person.id,
      type: 'person',
      position: person.position,
      hidden: !p.visibleIds.has(person.id),
      data: { person, last: lastContact(p.data, person) },
    })),
    ...p.data.texts.map((t) => ({
      id: t.id,
      type: 'note',
      position: t.position,
      style: { width: t.width, height: t.height },
      data: {
        text: t.text,
        resize: (width: number, height: number) =>
          p.update((d) => ({
            ...d,
            texts: d.texts.map((x) =>
              x.id === t.id ? { ...x, width, height } : x,
            ),
          })),
      },
    })),
  ];
  const [nodes, setNodes] = useState<Node[]>(toNodes);
  useEffect(() => {
    setNodes((old) =>
      toNodes().map((n) => ({
        ...n,
        selected: old.find((o) => o.id === n.id)?.selected,
      })),
    );
  }, [p.data, p.visibleIds]);
  useEffect(() => {
    if (p.focusId) {
      const person = p.data.people.find((x) => x.id === p.focusId);
      if (person) {
        flow.setCenter(person.position.x + 135, person.position.y + 90, {
          zoom: 1,
          duration: 350,
        });
        setNodes((ns) =>
          ns.map((n) => ({ ...n, selected: n.id === p.focusId })),
        );
      }
    }
  }, [p.focusId]);
  useEffect(() => {
    if (p.selectAllTick)
      setNodes((ns) => ns.map((n) => ({ ...n, selected: !n.hidden })));
  }, [p.selectAllTick]);
  const edges = useMemo(
    () =>
      p.data.relationships.map((e) => ({
        ...e,
        hidden: !p.visibleIds.has(e.source) || !p.visibleIds.has(e.target),
        label: e.label || e.type,
        type: 'smoothstep',
        style: { stroke: '#535e79', strokeWidth: 1.4 },
        labelStyle: { fill: '#a2aabd', fontSize: 12 },
        labelBgStyle: { fill: '#171a20' },
        labelBgPadding: [8, 5] as [number, number],
      })),
    [p.data.relationships, p.visibleIds],
  );
  return (
    <main className="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={p.data.viewport}
        minZoom={0.15}
        maxZoom={2}
        panOnDrag={hand ? true : [1, 2]}
        selectionOnDrag={!hand}
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}
        onNodesChange={(changes) =>
          setNodes((ns) => applyNodeChanges(changes, ns))
        }
        onSelectionChange={onSelectionChange}
        onNodeDragStop={(_, __, moved) =>
          p.update((d) => ({
            ...d,
            people: d.people.map((x) => {
              const n = moved.find((n) => n.id === x.id);
              return n ? { ...x, position: n.position } : x;
            }),
            texts: d.texts.map((x) => {
              const n = moved.find((n) => n.id === x.id);
              return n ? { ...x, position: n.position } : x;
            }),
          }))
        }
        onNodeClick={(_, n) => {
          if (n.type === 'person') p.open(n.id);
          else {
            const t = p.data.texts.find((x) => x.id === n.id);
            if (t) p.editText(t);
          }
        }}
        onConnect={(c) => {
          if (c.source && c.target && c.source !== c.target)
            p.connect(c.source, c.target);
        }}
        onEdgeClick={(_, e) => p.editEdge(e.id)}
        onMoveEnd={(_, viewport) =>
          p.update((d) => ({ ...d, viewport }), false)
        }
        onPaneContextMenu={(e) => p.context(e as React.MouseEvent)}
        onNodeContextMenu={(e, n) => p.context(e, n.id)}
        fitView={false}
        colorMode="dark"
        onlyRenderVisibleElements
      >
        <Background color="#30343c" gap={22} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor="#7586b8"
          maskColor="#111214bb"
          pannable
          zoomable
        />
      </ReactFlow>
      <div className="canvas-toolbar">
        <button
          aria-label="Select nodes"
          title="Select · drag empty space to select"
          className={!hand ? 'active' : ''}
          onClick={() => setHand(false)}
        >
          <MousePointer2 size={19} />
        </button>
        <button
          aria-label="Pan canvas"
          title="Pan canvas"
          className={hand ? 'active' : ''}
          onClick={() => setHand(true)}
        >
          <Hand size={19} />
        </button>
        <i />
        <button
          aria-label="Add connection"
          title="Add connection · N"
          onClick={p.add}
        >
          <Plus size={20} />
        </button>
        <button
          aria-label="Add text"
          title="Add text · T"
          onClick={() =>
            p.addText(
              flow.screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              }),
            )
          }
        >
          <Type size={19} />
        </button>
        <i />
        <button
          aria-label="Undo"
          title="Undo"
          disabled={!p.canUndo}
          onClick={p.undo}
        >
          <Undo2 size={18} />
        </button>
        <button
          aria-label="Redo"
          title="Redo"
          disabled={!p.canRedo}
          onClick={p.redo}
        >
          <Redo2 size={18} />
        </button>
        <button
          aria-label="Reset view"
          title="Reset view"
          onClick={() => flow.setViewport({ x: 0, y: 0, zoom: 1 })}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="canvas-caption">
        <Link2 size={13} />
        <span>
          Drag handles to connect · Shift to multi-select · Right-click for more
        </span>
      </div>
      {!p.data.people.length && (
        <div className="empty">
          <div className="empty-symbol">
            <NetworkIcon size={30} />
          </div>
          <h2>Build your network.</h2>
          <p>
            Add your first LinkedIn connection to start
            <br />
            mapping your professional network.
          </p>
          <button className="primary" onClick={p.add}>
            <Plus size={18} />
            Add Connection
          </button>
          <button className="text-button" onClick={p.loadDemo}>
            Explore an example network <ArrowUpRight size={15} />
          </button>
        </div>
      )}
    </main>
  );
}
