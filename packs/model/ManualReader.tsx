import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, RotateCw, Search, ZoomIn, ZoomOut, Scan } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask, TextLayer } from 'pdfjs-dist';
import { manualSections } from './manual-content';
import './model.css';

const BASE = import.meta.env.BASE_URL;
const PDF_URL = `${BASE}Centrac_B_IOM.pdf`;

type IndexPage = { page: number; printed: string; text: string };
type Props = { page: number; onPage: (page: number) => void };
export function ManualReader({ page, onPage }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(true), [index, setIndex] = useState<IndexPage[]>([]), [query, setQuery] = useState(''), [zoom, setZoom] = useState(1), [rotation, setRotation] = useState(0), [width, setWidth] = useState(800), [pageEntry, setPageEntry] = useState(String(page)), [indexError, setIndexError] = useState(false);
  const scroll = useRef<HTMLDivElement>(null), paper = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), text = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let task: ReturnType<typeof import('pdfjs-dist').getDocument> | undefined;
    import('pdfjs-dist').then(lib => {
      if (disposed) return;
      lib.GlobalWorkerOptions.workerSrc = `${BASE}pdfjs/pdf.worker.min.mjs`;
      task = lib.getDocument({ url: PDF_URL, standardFontDataUrl: `${BASE}pdfjs/standard_fonts/`, wasmUrl: `${BASE}pdfjs/wasm/` });
      return task.promise;
    }).then(doc => { if (doc && !disposed) setPdf(doc) }).catch(e => { if (!disposed) { setError('The embedded reader could not load. You can still open or download the PDF.'); setBusy(false); console.error(e) } });
    const abort = new AbortController();
    fetch(`${BASE}manual-index.json`, { signal: abort.signal }).then(r => { if (!r.ok) throw Error('Index failed'); return r.json() }).then(data => { if (!Array.isArray(data) || !data.every(p => typeof p.page === 'number' && typeof p.text === 'string' && typeof p.printed === 'string')) throw Error('Invalid manual index'); setIndex(data as IndexPage[]) }).catch(e => { if (e.name !== 'AbortError') setIndexError(true) });
    return () => { disposed = true; abort.abort(); void task?.destroy() };
  }, []);
  useEffect(() => { if (!scroll.current) return; const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width)); observer.observe(scroll.current); return () => observer.disconnect() }, []);
  useEffect(() => setPageEntry(String(page)), [page]);
  useEffect(() => {
    if (!pdf || !canvas.current || !paper.current || !text.current || width < 40) return;
    let stopped = false;
    let render: RenderTask | undefined;
    let layer: TextLayer | undefined;
    setBusy(true); setError('');
    (async () => {
      const p = await pdf.getPage(page);
      if (stopped) return;
      const effectiveRotation = (p.rotate + rotation) % 360;
      const natural = p.getViewport({ scale: 1, rotation: effectiveRotation });
      const scale = Math.max(.2, (width - 48) / natural.width) * zoom;
      const viewport = p.getViewport({ scale, rotation: effectiveRotation });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const c = canvas.current!, box = paper.current!, t = text.current!;
      c.width = Math.ceil(viewport.width * ratio); c.height = Math.ceil(viewport.height * ratio);
      c.style.width = `${viewport.width}px`; c.style.height = `${viewport.height}px`;
      box.style.width = `${viewport.width}px`; box.style.height = `${viewport.height}px`;
      box.style.setProperty('--total-scale-factor', String(scale));
      t.replaceChildren();
      scroll.current?.scrollTo({ top: 0, left: 0 });
      render = p.render({ canvas: c, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0], background: '#ffffff' });
      await render.promise;
      if (stopped) return;
      const { TextLayer } = await import('pdfjs-dist');
      if (stopped) return;
      layer = new TextLayer({ textContentSource: await p.getTextContent(), container: t, viewport });
      if (stopped) return;
      await layer.render();
      if (!stopped) setBusy(false);
    })().catch(e => { if (!stopped && e.name !== 'RenderingCancelledException' && e.name !== 'AbortException') { console.error(e); setError('This page could not render. Open the PDF below to read it.'); setBusy(false) } });
    return () => { stopped = true; render?.cancel(); layer?.cancel() };
  }, [pdf, page, width, zoom, rotation]);
  useEffect(() => { if (busy || !text.current) return; const needle = query.trim().toLowerCase(); for (const span of text.current.querySelectorAll('span')) span.classList.toggle('search-hit', needle.length > 1 && (span.textContent ?? '').toLowerCase().includes(needle)) }, [query, busy]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return index.filter(p => p.text.toLowerCase().includes(needle)).map(p => {
      const start = p.text.toLowerCase().indexOf(needle);
      return { ...p, excerpt: (start > 50 ? '…' : '') + p.text.slice(Math.max(0, start - 50), start + 140) + '…' };
    });
  }, [index, query]);
  const go = (n: number) => onPage(Math.max(1, Math.min(pdf?.numPages ?? 56, Number.isFinite(n) ? Math.trunc(n) : page)));
  const current = index.find(p => p.page === page);
  const searching = query.trim().length >= 2;
  return <div className="manual-workspace">
    <aside className="manual-sidebar"><div className="manual-intro"><span className="eyebrow">REFERENCE / 339-0038-000</span><h1>Operation & maintenance</h1><p>Centrac B · supplied IOM · 1/2004</p><span className="manual-size">56 pages <i />1.67 MB <i />9.7% smaller</span></div><div className="manual-search"><Search size={16} /><input aria-label="Search the manual" placeholder="Search all manual text…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="reader-toc"><span className="toc-label">{searching ? `${matches.length} MATCHING PAGES` : 'CONTENTS & DRAWINGS'}</span>{indexError && <p className="reader-small-note">Search index unavailable. Contents and page navigation still work.</p>}{searching ? matches.length ? matches.map(p => <button className={`toc-result ${p.page === page ? 'active' : ''}`} key={p.page} onClick={() => go(p.page)}><b>PDF {p.page} · printed {p.printed}</b><span>{p.excerpt}</span></button>) : <p className="reader-small-note">No matching text. Drawing labels stored as images are not searchable.</p> : manualSections.map(s => <button className={`toc-item ${s.page === page ? 'active' : ''}`} key={s.title} onClick={() => go(s.page)}><span>{s.title}</span><small>{s.label}</small></button>)}</div><div className="manual-sidebar-foot"><BookOpen size={13} />Original page order preserved.<br />Printed and PDF page numbers can differ.</div></aside>
    <section className="reader-main" aria-label="O&M document reader"><div className="reader-toolbar"><div className="reader-pages"><button aria-label="Previous page" disabled={page <= 1} onClick={() => go(page - 1)}><ChevronLeft /></button><form onSubmit={e => { e.preventDefault(); go(Number(pageEntry)) }}><label htmlFor="manual-page">PDF page</label><input id="manual-page" type="number" min="1" max={pdf?.numPages ?? 56} value={pageEntry} onChange={e => setPageEntry(e.target.value)} onBlur={() => go(Number(pageEntry))} /><span>/ {pdf?.numPages ?? 56}</span></form><button aria-label="Next page" disabled={page >= (pdf?.numPages ?? 56)} onClick={() => go(page + 1)}><ChevronRight /></button></div><div className="reader-zoom"><button aria-label="Zoom PDF out" disabled={zoom <= .5} onClick={() => setZoom(z => Math.max(.5, z - .25))}><ZoomOut /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom PDF in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + .25))}><ZoomIn /></button><button title="Fit width" aria-label="Fit PDF to width" onClick={() => setZoom(1)}><Scan /></button><button title="Rotate page" aria-label="Rotate PDF page clockwise" onClick={() => setRotation(r => (r + 90) % 360)}><RotateCw /></button></div><a className="reader-download" href={PDF_URL} download="Centrac_B_IOM_optimized.pdf"><ArrowDownToLine size={15} /><span>Download</span></a></div>
      <div className="reader-status"><span>Printed page <b>{current?.printed ?? '—'}</b></span><span aria-live="polite">{busy ? 'Rendering page…' : `Page ${page} of ${pdf?.numPages ?? 56}`}</span><a href={`${PDF_URL}#page=${page}`} target="_blank" rel="noreferrer">Open PDF <ArrowUpRight size={11} /></a></div>
      {error && <div className="reader-error" role="alert">{error} <a href={`${PDF_URL}#page=${page}`} target="_blank" rel="noreferrer">Open original page ↗</a></div>}
      <div className="reader-scroll" ref={scroll} tabIndex={0} aria-label="Manual page; scroll to read"><div ref={paper} className={`pdf-paper ${busy ? 'rendering' : ''}`}><canvas ref={canvas} aria-label={`Centrac B manual PDF page ${page}`} /><div ref={text} className="textLayer" /></div></div>
      <footer className="reader-bottom"><span>Lossless optimization · searchable text and diagram resolution preserved</span><span>All reader assets are local</span></footer>
    </section>
  </div>;
}
