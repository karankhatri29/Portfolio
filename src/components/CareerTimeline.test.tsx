import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CareerTimeline } from "@/components/CareerTimeline";
import { portfolioContent } from "@/data/portfolio";

const { timeline } = portfolioContent;

describe("CareerTimeline", () => {
  it("renders milestones in the supplied chronological order", () => {
    render(<CareerTimeline items={timeline} />);

    const years = screen.getAllByRole("term");
    expect(years).toHaveLength(timeline.length);
    expect(years[0]).toHaveTextContent(timeline[0].year);
    expect(screen.getByText(timeline[0].title)).toBeInTheDocument();
  });

  it("shows an empty state when there are no milestones", () => {
    render(<CareerTimeline items={[]} />);

    expect(screen.getByText("Timeline coming soon.")).toBeInTheDocument();
  });

  it("expands and collapses a milestone when its year is selected", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[1]).toHaveAttribute("aria-current", "step");

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("moves between milestones with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<CareerTimeline items={timeline} />);

    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(buttons[1]).toHaveFocus();

    await user.keyboard("{End}");
    expect(buttons[buttons.length - 1]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(buttons[buttons.length - 2]).toHaveFocus();
  });

  it("lists the tools used for a milestone", () => {
    render(<CareerTimeline items={timeline} />);

    expect(screen.getAllByRole("list", { name: /tools used for/i })).toHaveLength(timeline.filter((item) => item.tags?.length).length);
  });
});
