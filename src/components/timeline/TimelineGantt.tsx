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
    <article className="timeline-fade border border-accent/20 bg-ink/[0.04] p-6 shadow-[0_0_40px_-16px_rgb(var(--color-accent)/0.5)] backdrop-blur-xl">
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
  // While dragging, the playhead follows the pointer smoothly; the selected month (for the cards) still snaps.
  const [pos, setPos] = useState<number | null>(null);

  if (!gantt) return null;
  const { entries, first, last, total } = gantt;
  const month = Math.min(last, Math.max(first, at ?? gantt.now));
  const pct = (value: number) => `${(value / total) * 100}%`;

  const active = activeAt(entries, month).sort((a, b) => Number(b.key === focusKey) - Number(a.key === focusKey));
  const gap = active.length === 0 ? neighbours(entries, month) : null;
  const playheadAt = dragging && pos !== null ? pos : month - first + 0.5;

  const monthFromX = (clientX: number) => {
    const rect = chart.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return month;
    return first + Math.floor(Math.min(0.999999, Math.max(0, (clientX - rect.left) / rect.width)) * total);
  };

  const positionFromX = (clientX: number) => {
    const rect = chart.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * total;
  };

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as HTMLElement).closest("[data-bar]")) return;
    drag.current = true;
    setDragging(true);
    setFocusKey(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setAt(monthFromX(event.clientX));
    setPos(positionFromX(event.clientX));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setAt(monthFromX(event.clientX));
    setPos(positionFromX(event.clientX));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = false;
    setDragging(false);
    setPos(null);
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
      <div className="mt-12 flex pr-10">
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
          className="relative min-w-0 flex-1 touch-pan-y select-none bg-ink/[0.025] ring-1 ring-ink/10"
        >
          {/* Month grid and labels */}
          <div aria-hidden="true" className="absolute inset-0 flex">
            {Array.from({ length: total }, (_, index) => {
              const value = first + index;
              return (
                <div key={value} className={`relative flex-1 border-l ${isJanuary(value) ? "border-ink/20" : "border-ink/[0.05]"}`}>
                  <div className="absolute inset-x-0 top-1 text-center text-[11px] leading-4 text-muted">
                    <span className="block">{monthName(value)}</span>
                    {index === 0 || isJanuary(value) ? <span className="block font-semibold text-ink">{Math.floor(value / 12)}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className={`absolute inset-y-0 bg-gradient-to-b from-accent/[0.14] to-accent/0 ${dragging ? "" : "transition-[left] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"}`}
            style={{ left: pct(month - first), width: pct(1) }}
          />
          <div className="relative h-16" />
          <ul className="relative">
            {entries.map((entry) => {
              const isActive = active.includes(entry);
              return (
                <li key={entry.key} className={`relative border-t border-ink/[0.05] ${ROW_HEIGHT}`}>
                  <button
                    type="button"
                    data-bar
                    onClick={() => selectEntry(entry)}
                    aria-pressed={focusKey === entry.key}
                    aria-label={`${entry.item.organization}, ${entry.item.title}, ${entry.item.year}`}
                    title={`${entry.item.organization} · ${entry.item.year}`}
                    style={{ left: pct(entry.start - first), width: pct(entry.months) }}
                    className={`group absolute top-4 flex h-8 items-center justify-between overflow-visible whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-all duration-500 ease-out motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${isActive ? "bg-gradient-to-r from-accent/80 via-accent to-accent/85 text-paper shadow-[0_0_30px_-6px_rgb(var(--color-accent)/0.85)]" : "border border-ink/15 bg-ink/[0.06] text-muted hover:border-accent/50 hover:bg-ink/10 hover:text-ink"}`}
                  >
                    <span aria-hidden="true" className={`absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-500 ${isActive ? "border-paper bg-accent shadow-[0_0_10px_2px_rgb(var(--color-accent)/0.8)]" : "border-accent/50 bg-paper"}`} />
                    <span>{entry.months} mo</span>
                    {entry.ongoing ? (
                      <span className="flex items-center gap-1.5">
                        <span>now</span>
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-paper motion-safe:animate-pulse" />
                      </span>
                    ) : <span aria-hidden="true" className={`absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border transition-colors duration-500 ${isActive ? "border-paper bg-accent shadow-[0_0_10px_2px_rgb(var(--color-accent)/0.8)]" : "border-accent/50 bg-paper"}`} />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Playhead: follows the pointer while dragging, then glides to its month */}
          <div
            className={`pointer-events-none absolute inset-y-0 z-10 w-0 transition-[left] ${dragging ? "duration-100 ease-out" : "duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:duration-0"}`}
            style={{ left: pct(playheadAt) }}
          >
            <div aria-hidden="true" className="absolute bottom-0 left-0 top-16 w-px -translate-x-1/2 bg-gradient-to-b from-accent via-accent/70 to-accent/0 shadow-[0_0_14px_1px_rgb(var(--color-accent)/0.6)]" />
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
              className={`pointer-events-auto absolute left-0 top-9 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-paper shadow-[0_0_26px_-2px_rgb(var(--color-accent)/0.85)] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${dragging ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105"}`}
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
