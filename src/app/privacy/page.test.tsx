import { render, screen } from "@testing-library/react";

import PrivacyPage from "@/app/privacy/page";

describe("privacy page", () => {
  it("states what is and is not collected, in plain language", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Your privacy on this site" })).toBeInTheDocument();
    expect(screen.getByText(/do not use cookies for tracking/)).toBeInTheDocument();
    expect(screen.getByText(/Your real address is never stored/)).toBeInTheDocument();
    expect(screen.getByText(/Do Not Track or Global Privacy Control/)).toBeInTheDocument();
    for (const heading of ["What is counted when you visit", "If you send a message", "Errors", "Signing in"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("gives a way to request deletion of a message", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("link", { name: /@/ })).toHaveAttribute("href", expect.stringMatching(/^mailto:.+@.+/));
  });
});
