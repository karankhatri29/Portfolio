import { render, screen } from "@testing-library/react";

import { ContactFooter } from "@/components/ContactFooter";
import { portfolioContent } from "@/data/portfolio";

describe("ContactFooter", () => {
  it("renders named contact links with embedded icons", () => {
    render(<ContactFooter links={portfolioContent.contactLinks} />);

    for (const link of portfolioContent.contactLinks) {
      const contactLink = screen.getByRole("link", { name: link.label });
      expect(contactLink).toHaveAttribute("href", link.href);
      expect(contactLink.querySelector("svg")).toBeInTheDocument();
    }
  });
});
