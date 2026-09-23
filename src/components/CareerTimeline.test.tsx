import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CareerTimeline } from "@/components/CareerTimeline";
import { portfolioContent } from "@/data/portfolio";

const { timeline } = portfolioContent;
const now = new Date(2026, 8, 15); // September 2026, so the ongoing project runs May to Sep 2026

const slider = () => screen.getByRole("slider", { name: "Timeline date" });
const bar = (name: RegExp) => screen.getByRole("button", { name });
const chart = () => screen.getByTestId("timeline-chart");
const detail = () => within(document.querySelector<HTMLElement>('[aria-live="polite"]')!);
const rect = (width: number) => () => ({ left: 0, right: width, width, top: 0, bottom: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) });

describe("CareerTimeline (desktop chart)", () => {
  it("draws one labelled bar per project, with the project name as the main label", () => {
    render(<CareerTimeline items={timeline} now={now} />);

    for (const item of timeline) expect(bar(new RegExp(item.organization))).toBeInTheDocument();
    expect(bar(/Smart Data Compression/)).toHaveTextContent("3 mo");
    expect(bar(/Blockchain Based Marketplace/)).toHaveTextContent("5 mo");
    expect(bar(/Edge-Native Email Triage/)).toHaveTextContent("now");
  });

  it("starts on the latest project so the section is filled in without any interaction", () => {
    render(<CareerTimeline items={timeline} now={now} />);

    expect(slider()).toHaveAttribute("aria-valuetext", "September 2026");
    expect(detail().getByRole("heading", { name: "Edge-Native Email Triage Framework" })).toBeInTheDocument();
    expect(detail().getByText(timeline[0].summary)).toBeInTheDocument();
    expect(detail().queryByRole("heading", { name: "Smart Data Compression Algorithm" })).not.toBeInTheDocument();
  });

  it("moves the playhead with the keyboard and shows what was running", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} now={now} />);

    slider().focus();
    await user.keyboard("{Home}");
    expect(slider()).toHaveAttribute("aria-valuetext", "March 2025");
    expect(detail().getByRole("heading", { name: "Smart Data Compression Algorithm" })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(slider()).toHaveAttribute("aria-valuetext", "April 2025");
    // Two projects overlapped in April 2025.
    expect(detail().getByRole("heading", { name: "Smart Data Compression Algorithm" })).toBeInTheDocument();
    expect(detail().getByRole("heading", { name: "Blockchain Based Marketplace" })).toBeInTheDocument();

    await user.keyboard("{End}");
    expect(slider()).toHaveAttribute("aria-valuetext", "September 2026");
  });

  it("explains gaps between projects instead of showing an empty box", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} now={now} />);

    slider().focus();
    // March 2025 + 7 months = October 2025, between the marketplace (ends Aug) and the recommender (starts Nov).
    await user.keyboard("{Home}{PageUp}{PageUp}{ArrowRight}");
    expect(slider()).toHaveAttribute("aria-valuetext", "October 2025");
    expect(detail().getByText("Nothing listed for October 2025.")).toBeInTheDocument();
    expect(detail().getByText(/Blockchain Based Marketplace wrapped up in August 2025/)).toBeInTheDocument();
    expect(detail().getByText(/Context-Aware Recommendation Engine started in November 2025/)).toBeInTheDocument();
  });

  it("jumps the playhead to a bar's midpoint and shows that project", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} now={now} />);

    await user.click(bar(/Blockchain Based Marketplace/));

    expect(bar(/Blockchain Based Marketplace/)).toHaveAttribute("aria-pressed", "true");
    expect(slider()).toHaveAttribute("aria-valuetext", "June 2025");
    expect(detail().getByRole("heading", { name: "Blockchain Based Marketplace" })).toBeInTheDocument();
  });

  it("lists the selected project first when another one overlaps it", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} now={now} />);

    await user.click(bar(/Smart Data Compression/)); // midpoint April 2025, where the marketplace also ran

    const headings = detail().getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Smart Data Compression Algorithm", "Blockchain Based Marketplace"]);
  });

  it("follows a click or drag on the chart and stops following when released", () => {
    render(<CareerTimeline items={timeline} now={now} />);
    // 19 months across 1900px is 100px per month, starting March 2025.
    chart().getBoundingClientRect = rect(1900);
    const pointer = (type: string, clientX: number, button = 0) => fireEvent(chart(), new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button }));

    pointer("pointerdown", 150);
    expect(slider()).toHaveAttribute("aria-valuetext", "April 2025");

    pointer("pointermove", 1250);
    expect(slider()).toHaveAttribute("aria-valuetext", "March 2026");

    pointer("pointerup", 1250);
    pointer("pointermove", 50);
    expect(slider()).toHaveAttribute("aria-valuetext", "March 2026");
  });

  it("ignores non-primary mouse buttons on the chart", () => {
    render(<CareerTimeline items={timeline} now={now} />);
    chart().getBoundingClientRect = rect(1900);

    fireEvent(chart(), new MouseEvent("pointerdown", { bubbles: true, clientX: 150, button: 2 }));

    expect(slider()).toHaveAttribute("aria-valuetext", "September 2026");
  });

  it("clamps the playhead to the ends of the timeline", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} now={now} />);

    slider().focus();
    await user.keyboard("{ArrowRight}{PageUp}");
    expect(slider()).toHaveAttribute("aria-valuetext", "September 2026");
    await user.keyboard("{Home}{ArrowLeft}{PageDown}");
    expect(slider()).toHaveAttribute("aria-valuetext", "March 2025");
  });
});

describe("CareerTimeline (list)", () => {
  it("still renders every milestone as a term in the supplied order", () => {
    const { container } = render(<CareerTimeline items={timeline} now={now} />);

    const years = within(container.querySelector("dl")!).getAllByRole("term");
    expect(years).toHaveLength(timeline.length);
    expect(years[0]).toHaveTextContent(timeline[0].year);
  });

  it("uses only the list when entries have no dates", () => {
    const undated = timeline.map(({ start: _start, end: _end, ...rest }) => rest);
    render(<CareerTimeline items={undated} now={now} />);

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(undated.length);
  });

  it("shows an empty state when there are no milestones", () => {
    render(<CareerTimeline items={[]} />);

    expect(screen.getByText("Timeline coming soon.")).toBeInTheDocument();
  });

  it("expands a milestone to show its tools", async () => {
    const user = userEvent.setup();
    const { container } = render(<CareerTimeline items={timeline} now={now} />);

    const yearButton = within(container.querySelector("dl")!).getAllByRole("button")[1];
    expect(yearButton).toHaveAttribute("aria-expanded", "false");
    await user.click(yearButton);
    expect(yearButton).toHaveAttribute("aria-expanded", "true");
  });
});
