'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Layers, Activity, Scissors, Search, RotateCcw, Maximize, Plus, Minus, Play, Pause, ChevronRight, ArrowUpRight, Focus, Eye, EyeOff, Tag, Download, BookOpen, X, MousePointer2, Check, Copy, Wrench, Stethoscope, Expand } from 'lucide-react';
import { parts, byId } from './parts';
import type { PumpScene, ViewState } from './pumpScene';
import { ManualReader } from './ManualReader';
import { MaintenanceGuide, TroubleshootingGuide } from './ServiceGuides';
import './model.css';

const PDF = `${import.meta.env.BASE_URL}Centrac_B_IOM.pdf`;

type Workspace = 'model' | 'manual' | 'maintenance' | 'troubleshooting';

export default function ModelPack() {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<PumpScene | null>(null);
  const [mode, setMode] = useState('assembled'), [explode, setExplode] = useState(0), [xray, setXray] = useState(false), [shellOpacity, setShellOpacity] = useState(.025), [cutaway, setCutaway] = useState(false), [cutSide, setCutSide] = useState(1), [running, setRunning] = useState(false), [speed, setSpeed] = useState(.5), [labels, setLabels] = useState(false), [selected, setSelected] = useState<string | null>(null), [isolate, setIsolate] = useState(false), [phase, setPhase] = useState(0), [query, setQuery] = useState(''), [section, setSection] = useState('All'), [ready, setReady] = useState(false), [error, setError] = useState(''), [sources, setSources] = useState(false), [copied, setCopied] = useState(false), [exporting, setExporting] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>('model'), [manualPage, setManualPage] = useState(1), [seen, setSeen] = useState<Workspace[]>(['model']);
  const [uiHidden, setUiHidden] = useState(false), [inspMin, setInspMin] = useState(false);
  useEffect(() => { setInspMin(false) }, [selected]);
  const phaseRef = useRef(0);
  const [scrub, setScrub] = useState(0);
  const state = useRef<ViewState>({ explode, xray, shellOpacity, cutaway, cutSide, running, speed, labels, selected, isolate, phase: scrub, mode });
  state.current = { explode, xray, shellOpacity, cutaway, cutSide, running, speed, labels, selected, isolate, phase: scrub, mode };
  const show = (next: Workspace) => {
    setSeen(prev => (prev.includes(next) ? prev : [...prev, next]));
    setWorkspace(next);
  };
  useEffect(() => {
    let cancelled = false;
    import('./pumpScene').then(({ createPumpScene }) => {
      if (cancelled || !host.current) return;
      try {
        engine.current = createPumpScene(host.current, (id) => { setSelected(id); setIsolate(false) }, p => { phaseRef.current = p; setPhase(p) });
        engine.current.update(state.current);
        engine.current.setActive(workspace === 'model');
        setReady(true);
      } catch (e) { console.error(e); setError('The 3D view could not start. Enable hardware acceleration / WebGL, then reload. The parts list and manual remain available.'); }
    }).catch(() => setError('Unable to load the 3D viewer. Please reload.'));
    return () => { cancelled = true; engine.current?.dispose(); engine.current = null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { engine.current?.setActive(workspace === 'model') }, [workspace, ready]);
  useEffect(() => { engine.current?.update(state.current) }, [explode, xray, shellOpacity, cutaway, cutSide, running, speed, labels, selected, isolate, scrub, mode]);

  useEffect(() => {
    if (!sources) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector('.reference-modal') as HTMLElement;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button,a[href]'));
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSources(false);
      if (e.key === 'Tab') {
        const nodes = focusable();
        if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus() }
        else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus() }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus() };
  }, [sources]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'configure_pump_view', title: 'Configure pump explorer',
      description: 'Set the Centrac B view mode and optionally select a part by its component ID. This only changes the visible local viewer.',
      inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['assembled', 'exploded', 'mechanism', 'cutaway'] }, partId: { type: 'string', enum: parts.map(p => p.id) } }, required: ['mode'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const p = input as { mode?: string; partId?: string };
        if (!p || !['assembled', 'exploded', 'mechanism', 'cutaway'].includes(p.mode ?? '') || (p.partId && !byId[p.partId])) throw new Error('Invalid view mode or component ID');
        show('model');
        changeMode(p.mode!);
        setSelected(p.partId ?? null);
        await new Promise(resolve => setTimeout(resolve, 80));
        return { mode: p.mode, selected: p.partId ? byId[p.partId] : null };
      }
    };
    try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(console.warn) } catch (e) { console.warn(e) }
    return () => lifecycle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeMode(next: string) {
    setMode(next); setIsolate(false); setLabels(next === 'exploded'); setExplode(next === 'exploded' ? .72 : 0);
    setCutaway(next === 'cutaway'); setXray(next === 'mechanism'); setCutSide(1);
    setRunning(next === 'mechanism' || next === 'cutaway');
    setTimeout(() => engine.current?.setView('iso'), 50);
  }
  function toggleXray() {
    const enable = !xray;
    setXray(enable);
    if (enable) { setCutaway(false); setIsolate(false); setExplode(0); if (mode === 'cutaway') setMode('mechanism'); setTimeout(() => engine.current?.setView('section'), 50) }
  }
  function openManual(page = 1) { setManualPage(page); setSources(false); show('manual') }
  function openPart(id: string) { show('model'); setSelected(id); setIsolate(false); changeMode('cutaway'); setTimeout(() => engine.current?.focus(id), 120) }
  function pause() { setScrub(phaseRef.current); setRunning(v => !v) }
  function reset() { setSelected(null); setIsolate(false); setScrub(0); setPhase(0); changeMode('assembled') }
  function exportParts() {
    const rows = [['Figure', 'Item', 'Description', 'Part number', 'Quantity', 'Printed manual page', 'Configuration'], ...parts.map(p => [String(p.figure), p.item, p.name, p.pn, p.qty, String(p.page), 'Simplex / 1 HP / 1-inch 316SS / single-ball / head <1600 psig'])];
    const blob = new Blob([rows.map(r => r.map(c => '"' + c.replaceAll('"', '""') + '"').join(',')).join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'centrac-b-illustrated-parts.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  const filtered = parts.filter(p => (section === 'All' || p.section === section) && `${p.name} ${p.item} ${p.pn}`.toLowerCase().includes(query.toLowerCase()));
  const part = selected ? byId[selected] : null;
  const discharge = phase < 50;
  const operating = mode === 'mechanism' || mode === 'cutaway';
  const tabs: { id: Workspace; name: string; icon: typeof Box }[] = [
    { id: 'model', name: '3D model', icon: Box },
    { id: 'manual', name: 'O&M reader', icon: BookOpen },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: Stethoscope },
  ];
  return <div className="cb-model">
    <main className="explorer">
      <header className="header"><div className="identity"><span className="brand-symbol"><Box size={22} /></span><div><b>CENTRAC<span className="b-mark"> B</span></b><span className="identity-sub">MILTON ROY · COMPONENT EXPLORER</span></div></div><div className="workspace-tabs" role="tablist" aria-label="Model workspace">{tabs.map(({ id, name, icon: Icon }) => <button key={id} role="tab" aria-selected={workspace === id} className={workspace === id ? 'active' : ''} onClick={() => show(id)}><Icon size={14} /><span>{name}</span></button>)}</div><button className="manual-button" onClick={() => setSources(true)}><BookOpen /> Reference library <ArrowUpRight size={13} /></button></header>
      <div className="model-panel" hidden={workspace !== 'model'}><aside className="sidebar"><div className="sidebar-heading"><span className="eyebrow">MODEL CONFIGURATION</span><h1>Inside the Centrac B</h1><p>Simplex · 1″ plunger · 316SS liquid end</p><span className="configuration-tag">1 HP DRIVE <span> / </span> SINGLE-BALL CHECKS</span></div><div className="parts-heading"><h2>Components <span>{parts.length}</span></h2><button title="Export illustrated parts as CSV" aria-label="Export illustrated parts as CSV" onClick={exportParts}><Download size={16} /></button></div><div className="search"><Search size={15} /><input aria-label="Search parts by name, item or number" placeholder="Find a part or part number…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="filter-tabs">{['All', 'Drive', 'Liquid end'].map(s => <button key={s} className={s === section ? 'active' : ''} onClick={() => setSection(s)}>{s}</button>)}</div><div className="part-list">{filtered.length === 0 ? <p className="empty">No matching components.<br />Try a name, item, or part number.</p> : filtered.map(p => <button key={p.id} className={`part-row ${selected === p.id ? 'selected' : ''}`} onClick={() => { setSelected(p.id); setIsolate(false) }}><span className={`part-item ${p.section === 'Liquid end' ? 'liquid-item' : ''}`}>{p.item}</span><span className="part-text"><b>{p.name}</b><code>{p.pn}</code></span><ChevronRight size={13} /></button>)}</div><div className="sidebar-footer"><span className="tiny-dot" />Part numbers from the supplied IOM<span>Illustrated selection · not a full bill of materials</span></div></aside>
        <section className={`viewport ${xray || cutaway ? 'inspecting' : ''}${uiHidden ? ' ui-hidden' : ''}`} aria-label="3D pump explorer"><div ref={host} className="canvas-host" />{!ready && !error && <div className="loading"><Box size={28} /><span>Preparing the pump assembly…</span></div>}{error && <div className="loading error">{error}</div>}
          <div className="view-heading"><span className="eyebrow">{mode === 'assembled' ? '01 / ASSEMBLY' : mode === 'exploded' ? '02 / EXPLODED ASSEMBLY' : mode === 'cutaway' ? '04 / HALF-SECTION' : '03 / OPERATING PRINCIPLE'}</span><h2>{mode === 'assembled' ? 'Precision, in every part.' : mode === 'exploded' ? 'Every component. In context.' : mode === 'cutaway' ? 'Split open. See it work.' : 'See the mechanism in motion.'}</h2><p>{mode === 'assembled' ? 'Orbit the pump. Select any component to inspect.' : mode === 'exploded' ? 'Separate the assembly and trace each part to the manual.' : mode === 'cutaway' ? 'Half the casing removed. Moving parts remain complete.' : 'Faint casing. Bright internals. Follow the pumping cycle.'}</p></div>
          <div className="mode-switch" aria-label="View mode">{[{ id: 'assembled', name: 'Assembled', icon: Box }, { id: 'exploded', name: 'Exploded', icon: Layers }, { id: 'mechanism', name: 'Working', icon: Activity }, { id: 'cutaway', name: 'Cutaway', icon: Scissors }].map(({ id, name, icon: Icon }) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => changeMode(id)}><Icon size={16} />{name}</button>)}</div>
          <div className="view-tools"><button title={uiHidden ? 'Show interface' : 'Hide interface for a clear view'} aria-label={uiHidden ? 'Show interface' : 'Hide interface'} aria-pressed={uiHidden} className={uiHidden ? 'active' : ''} onClick={() => setUiHidden(v => !v)}>{uiHidden ? <EyeOff /> : <Eye />}</button><span /><button title="Reset view" aria-label="Reset camera" onClick={() => engine.current?.setView('iso')}><RotateCcw /></button><button title="Zoom in" aria-label="Zoom in" onClick={() => engine.current?.zoom(.8)}><Plus /></button><button title="Zoom out" aria-label="Zoom out" onClick={() => engine.current?.zoom(1.25)}><Minus /></button><span /><button title="Full screen" aria-label="Toggle full screen" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else document.querySelector('.cb-model .explorer')?.requestFullscreen().catch(() => setError('Full screen is unavailable in this window.')) }}><Maximize /></button></div>
          <button className="download-model" disabled={!ready || exporting} onClick={async () => { setExporting(true); try { await engine.current?.exportModel() } catch (e) { console.error(e); setError("Model export failed. Try exporting again after reloading.") } finally { setExporting(false) } }}><Download size={13} />{exporting ? "Exporting…" : "Download 3D"}</button>
          <div className="camera-views">{['iso', 'front', 'end', 'top'].map(v => <button key={v} onClick={() => engine.current?.setView(v === 'front' && cutaway ? 'section' : v)}>{v}</button>)}</div>
          {part && <div className={`inspection${inspMin ? ' minimized' : ''}`}><div className="inspection-top"><span className="eyebrow">{part.section.toUpperCase()} / ITEM {part.item}</span><span className="inspection-top-btns"><button aria-label={inspMin ? 'Expand part details' : 'Minimize part details'} aria-pressed={inspMin} onClick={() => setInspMin(v => !v)}>{inspMin ? <Expand size={15} /> : <Minus size={15} />}</button><button aria-label="Close part details" onClick={() => { setSelected(null); setIsolate(false) }}><X size={15} /></button></span></div><h3>{part.name}</h3><div className="pn"><code>{part.pn}</code><button aria-label="Copy part number" onClick={async () => { try { await navigator.clipboard.writeText(part.pn); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { setCopied(false) } }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div><p>{part.description}</p><div className="part-meta"><span>QUANTITY<b>{part.qty}</b></span><span>REFERENCE<b>Fig. {part.figure} · p. {part.page}</b></span></div><div className="inspection-actions"><button onClick={() => selected && engine.current?.focus(selected)}><Focus size={14} />Focus</button><button className={isolate ? 'enabled' : ''} onClick={() => { setIsolate(v => !v); setTimeout(() => selected && engine.current?.focus(selected), 30) }}><Eye size={14} />{isolate ? 'Show all' : 'Isolate'}</button><button title="Read original parts table" aria-label="Read original parts table" onClick={() => openManual(part.page + (part.figure === 8 ? 6 : 5))}><BookOpen size={16} /></button></div></div>}
          <div className="bottom-zone">{(xray || cutaway) && <div className="section-options"><div className="mechanism-legend"><span><i className="gear-key" />Gears</span><span><i className="piston-key" />Plunger / yoke</span><span><i className="diaphragm-key" />Diaphragm</span><span><i className="valve-key" />Checks</span></div>{xray ? <label className="shell-opacity"><span>Casing <b>{Number((shellOpacity * 100).toFixed(1))}%</b></span><input type="range" aria-label="X-ray casing opacity" min="0" max="15" step="0.5" value={shellOpacity * 100} onChange={e => setShellOpacity(Number(e.target.value) / 100)} /></label> : <button className="flip-cut" onClick={() => { setCutSide(v => -v); setTimeout(() => engine.current?.setView('section'), 50) }}><Scissors size={13} />Show other half</button>}</div>}{operating && <div className="cycle-card"><span className={`cycle-dot ${discharge ? 'discharge' : ''}`} /><div><b>{discharge ? 'Discharge stroke' : 'Suction stroke'}</b><p>{discharge ? 'Plunger advances · outlet check opens' : 'Plunger retracts · inlet check opens'}</p></div><span className="hydraulic-tag">HYDRAULIC TRANSFER</span></div>}
            <div className="control-panel"><div className="control-main">{mode === 'exploded' ? <><div className="control-label"><Layers size={17} /><span>Explode assembly</span><b>{Math.round(explode * 100)}%</b></div><input type="range" aria-label="Explosion amount" min="0" max="100" value={explode * 100} onChange={e => setExplode(Number(e.target.value) / 100)} /><span className="range-ends"><span>Assembled</span><span>Separated</span></span></> : operating ? <><div className="play-line"><button className="play-button" onClick={pause} aria-label={running ? 'Pause animation' : 'Play animation'}>{running ? <Pause size={16} /> : <Play size={16} />}</button><div><b>{running ? 'Mechanism running' : 'Mechanism paused'}</b><span>Illustrative motion · diaphragm flex exaggerated</span></div><label className="speed-label">Speed<select aria-label="Animation speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label></div><input type="range" aria-label="Cycle position" min="0" max="100" value={running ? phase : scrub} onChange={e => { const p = Number(e.target.value); setRunning(false); setScrub(p); setPhase(p); phaseRef.current = p }} /><span className="range-ends"><span>Discharge</span><span>One cycle · {Math.round(running ? phase : scrub)}%</span><span>Suction</span></span></> : <div className="assembled-message"><Box size={24} /><div><b>Explore the complete assembly</b><p>Try Working for X-ray or Cutaway to open half the casing.</p></div></div>}</div><div className="display-controls"><button className={xray ? 'enabled' : ''} aria-pressed={xray} onClick={toggleXray}><Eye size={16} /> X-ray <span className="toggle"><i /></span></button><button className={labels ? 'enabled' : ''} aria-pressed={labels} onClick={() => { setLabels(v => !v); if (explode < .05) { setMode('exploded'); setExplode(.72); setRunning(false) } }}><Tag size={16} /> Part labels <span className="toggle"><i /></span></button></div></div>
            <div className="viewport-footer"><span><MousePointer2 size={12} /> Drag to orbit <i>·</i> Scroll to zoom <i>·</i> Right-drag to pan</span><button onClick={reset}><RotateCcw size={12} />Reset all</button></div></div>
          <div className="model-note">ILLUSTRATIVE RECONSTRUCTION · NOT DIMENSIONAL CAD</div>
        </section></div>
      {seen.includes('manual') && <div className="document-panel" hidden={workspace !== 'manual'}><ManualReader page={manualPage} onPage={setManualPage} /></div>}
      {seen.includes('maintenance') && <div className="document-panel service-panel" hidden={workspace !== 'maintenance'}><MaintenanceGuide onManual={openManual} onPart={openPart} /></div>}
      {seen.includes('troubleshooting') && <div className="document-panel service-panel" hidden={workspace !== 'troubleshooting'}><TroubleshootingGuide onManual={openManual} onPart={openPart} /></div>}
      {sources && <div className="modal-backdrop" onClick={() => setSources(false)}><section className="reference-modal" role="dialog" aria-modal="true" aria-label="Reference library" onClick={e => e.stopPropagation()}><div className="modal-heading"><BookOpen size={24} /><button aria-label="Close reference library" onClick={() => setSources(false)}><X /></button></div><span className="eyebrow">SOURCE MATERIAL</span><h2>Grounded in the manual.</h2><p>The model reconstructs the simplex drive and a 106 mm metallic HPD liquid end from the supplied Centrac B IOM. Part numbers are transcribed for the selected configuration.</p><button className="source-link" onClick={() => openManual(1)}><BookOpen /><span><b>Centrac B · Installation & operation manual</b><small>56 PDF pages · parts tables on printed pages 21–32</small></span><ArrowUpRight /></button><button className="source-link" onClick={() => openManual(26)}><Layers /><span><b>Figure 8 · Simplex drive</b><small>Drawing 102-2925-0001 · printed page 20</small></span><ArrowUpRight /></button><button className="source-link" onClick={() => openManual(40)}><Layers /><span><b>Figure 10 · Metallic liquid end</b><small>Drawing 102-2925-0006 · PDF page 40</small></span><ArrowUpRight /></button><a className="source-link" href="https://www.miltonroy.com/en-nam/metering-pumps/centrac-series/b-model/" target="_blank" rel="noreferrer"><Box /><span><b>Milton Roy · Official product page</b><small>Manufacturer overview and specifications</small></span><ArrowUpRight /></a><div className="reference-note"><b>About this reconstruction</b><p>Geometry, clearances, gear tooth forms, motor details and motion timing are illustrative. Part numbers vary by motor, plunger, material and pressure. Confirm the installed model and serial number before ordering. This is an independent viewer, not a manufacturer CAD model or service procedure.</p></div></section></div>}
    </main>
  </div>;
}
