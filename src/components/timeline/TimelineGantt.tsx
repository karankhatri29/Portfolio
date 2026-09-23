"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import type { TimelineItem } from "@/data/portfolio";
import { activeAt, buildGantt, formatMonth, isJanuary, monthName, neighbours } from "@/lib/timeline/months";
import type { GanttEntry } from "@/lib/timeline/months";

const ROW_HEIGHT = "h-16";

function DetailCard({ entry }: { entry: GanttEntry }) {
  const { item } = entry;
  return (
    <article className="timeline-fade border border-ink/10 p-6">
      <p className="text-sm font-semibold text-accent">{item.year}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">{item.organization}</h3>
      <p className="mt-1 text-sm text-muted">{item.title}</p>
      <p className="mt-4 max-w-xl leading-7 text-muted">{item.summary}</p>
      {item.tags?.length ? (
        <ul aria-label={`Tools used for ${item.organization}`} className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => <li key={tag} className="rounded-full border border-accent/40 px-3 py-1 text-xs text-ink">{tag}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

export function TimelineGantt({ items, now }: { items: TimelineItem[]; now?: Date }) {
  const gantt = useMemo(() => buildGantt(items, now ?? new Date()), [items, now]);
  const chart = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const [at, setAt] = useState<number | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  if (!gantt) return null;
  const { entries, first, last, total } = gantt;
  const month = Math.min(last, Math.max(first, at ?? gantt.now));
  const pct = (value: number) => `${(value / total) * 100}%`;

  const active = activeAt(entries, month).sort((a, b) => Number(b.key === focusKey) - Number(a.key === focusKey));
  const gap = active.length === 0 ? neighbours(entries, month) : null;

  const monthFromX = (clientX: number) => {
    const rect = chart.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return month;
    return first + Math.floor(Math.min(0.999999, Math.max(0, (clientX - rect.left) / rect.width)) * total);
  };

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as HTMLElement).closest("[data-bar]")) return;
    drag.current = true;
    setDragging(true);
    setFocusKey(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setAt(monthFromX(event.clientX));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) setAt(monthFromX(event.clientX));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -3, PageUp: 3 };
    let next: number | undefined;
    if (event.key in steps) next = month + steps[event.key];
    else if (event.key === "Home") next = first;
    else if (event.key === "End") next = last;
    if (next === undefined) return;
    event.preventDefault();
    setFocusKey(null);
    setAt(Math.min(last, Math.max(first, next)));
  }

  function selectEntry(entry: GanttEntry) {
    setFocusKey(entry.key);
    setAt(Math.floor((entry.start + entry.end) / 2));
  }

  return (
    <div>
      <div className="mt-12 flex">
        <div aria-hidden="true" className="w-56 shrink-0 pr-6 xl:w-72">
          <div className="h-16" />
          {entries.map((entry) => (
            <div key={entry.key} className={`${ROW_HEIGHT} flex flex-col justify-center text-right`}>
              <p className={`line-clamp-2 text-sm font-semibold leading-5 transition-colors ${active.includes(entry) ? "text-ink" : "text-muted"}`}>{entry.item.organization}</p>
              <p className="truncate text-xs text-muted">{entry.item.title}</p>
            </div>
          ))}
        </div>

        <div
          ref={chart}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          data-testid="timeline-chart"
          className="relative min-w-0 flex-1 touch-pan-y select-none"
        >
          {/* Month grid and labels */}
          <div aria-hidden="true" className="absolute inset-0 flex">
            {Array.from({ length: total }, (_, index) => {
              const value = first + index;
              return (
                <div key={value} className={`relative flex-1 border-l ${isJanuary(value) ? "border-ink/25" : "border-ink/[0.07]"}`}>
                  <div className="absolute inset-x-0 top-1 text-center text-[11px] leading-4 text-muted">
                    <span className="block">{monthName(value)}</span>
                    {index === 0 || isJanuary(value) ? <span className="block font-semibold text-ink">{Math.floor(value / 12)}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative h-16" />
          <ul className="relative">
            {entries.map((entry) => {
              const isActive = active.includes(entry);
              return (
                <li key={entry.key} className={`relative ${ROW_HEIGHT}`}>
                  <button
                    type="button"
                    data-bar
                    onClick={() => selectEntry(entry)}
                    aria-pressed={focusKey === entry.key}
                    aria-label={`${entry.item.organization}, ${entry.item.title}, ${entry.item.year}`}
                    title={`${entry.item.organization} · ${entry.item.year}`}
                    style={{ left: pct(entry.start - first), width: pct(entry.months) }}
                    className={`absolute top-4 flex h-8 items-center justify-between overflow-visible whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${isActive ? "bg-accent text-paper" : "bg-ink/15 text-muted hover:bg-ink/25 hover:text-ink"}`}
                  >
                    <span>{entry.months} mo</span>
                    {entry.ongoing ? (
                      <span className="flex items-center gap-1.5">
                        <span>now</span>
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-paper motion-safe:animate-pulse" />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Playhead */}
          <div
            className={`pointer-events-none absolute inset-y-0 z-10 w-0 ${dragging ? "" : "transition-[left] duration-200 ease-out"}`}
            style={{ left: pct(month - first + 0.5) }}
          >
            <div aria-hidden="true" className="absolute bottom-0 left-0 top-16 w-px -translate-x-1/2 bg-accent" />
            <div
              role="slider"
              tabIndex={0}
              aria-label="Timeline date"
              aria-orientation="horizontal"
              aria-valuemin={first}
              aria-valuemax={last}
              aria-valuenow={month}
              aria-valuetext={formatMonth(month, true)}
              onKeyDown={onKeyDown}
              className={`pointer-events-auto absolute left-0 top-9 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-paper shadow-lg shadow-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            >
              {formatMonth(month)}
            </div>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="mt-10">
        {active.length ? (
          <div className={`grid gap-5 ${active.length > 1 ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}>
            {active.map((entry) => <DetailCard key={entry.key} entry={entry} />)}
          </div>
        ) : (
          <div className="timeline-fade mx-auto max-w-3xl border border-dashed border-ink/20 p-6">
            <p className="font-semibold">Nothing listed for {formatMonth(month, true)}.</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {gap?.before ? `${gap.before.item.organization} wrapped up in ${formatMonth(gap.before.end, true)}. ` : ""}
              {gap?.after ? `${gap.after.item.organization} started in ${formatMonth(gap.after.start, true)}.` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
