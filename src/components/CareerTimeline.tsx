import { TimelineGantt } from "@/components/timeline/TimelineGantt";
import { TimelineList } from "@/components/timeline/TimelineList";
import type { TimelineItem } from "@/data/portfolio";
import { buildGantt } from "@/lib/timeline/months";

/**
 * Desktop shows a Gantt-style chart with a draggable playhead when every entry has dates;
 * phones, tablets and undated data use the stacked list.
 */
export function CareerTimeline({ items, now }: { items: TimelineItem[]; now?: Date }) {
  const dated = buildGantt(items, now ?? new Date()) !== null;

  return (
    <section aria-labelledby="timeline-title" className="border-b border-ink/10 py-16 lg:py-20">
      <h2 id="timeline-title" className="text-center font-display text-3xl font-semibold lg:text-4xl">A short timeline</h2>
      {items.length ? (
        <>
          {dated ? <p className="mx-auto mt-3 hidden max-w-xl text-center text-sm text-muted lg:block">Drag the line through time, or select a project.</p> : null}
          <p className={`mx-auto mt-3 max-w-xl text-center text-sm text-muted ${dated ? "lg:hidden" : ""}`}>Scroll through, or select a milestone to see what I used.</p>
          {dated ? <div className="hidden lg:block"><TimelineGantt items={items} now={now} /></div> : null}
          <div className={dated ? "lg:hidden" : ""}><TimelineList items={items} /></div>
        </>
      ) : <p className="mt-8 text-center text-muted">Timeline coming soon.</p>}
    </section>
  );
}
