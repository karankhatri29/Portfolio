import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthControls } from "@/components/AuthControls";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("AuthControls", () => {
  it("offers Google and GitHub from a single compact Sign in menu when signed out", async () => {
    const onSignIn = jest.fn();
    render(<AuthControls session={null} onSignIn={onSignIn} />);

    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Sign in" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /continue with Google/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /continue with GitHub/i }));
    expect(onSignIn).toHaveBeenCalledWith("github");
    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument();
  });

  it("closes the sign in menu with Escape or an outside click and returns focus to the trigger", async () => {
    render(<AuthControls session={null} onSignIn={jest.fn()} />);
    const trigger = screen.getByRole("button", { name: "Sign in" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument();
  });

  it("shows identity and role when signed in", () => {
    render(
      <AuthControls
        session={{ user: { name: "Owner", email: "owner@example.com" }, role: "Admin" }}
        onSignOut={jest.fn()}
      />,
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
