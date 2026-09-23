import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthControls, initialsOf } from "@/components/AuthControls";

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

  describe("signed in", () => {
    const admin = { user: { name: "Karan Khatri", email: "owner@example.com", image: "https://lh3.googleusercontent.com/a/photo" }, role: "Admin" as const };
    const trigger = () => screen.getByRole("button", { name: /account menu/i });

    it("shows a compact avatar button and keeps the account details in a closed menu", () => {
      render(<AuthControls session={admin} onSignOut={jest.fn()} />);

      expect(trigger()).toHaveAccessibleName("Account menu, signed in as Karan Khatri");
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
      expect(screen.queryByText("owner@example.com")).not.toBeInTheDocument();
    });

    it("opens to show name, email, role and the admin links for an Admin", async () => {
      render(<AuthControls session={admin} onSignOut={jest.fn()} />);

      await userEvent.click(trigger());

      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(screen.getAllByText("Karan Khatri").length).toBeGreaterThan(0);
      expect(screen.getByText("owner@example.com")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      const nav = within(screen.getByRole("navigation", { name: "Admin" }));
      expect(nav.getByRole("link", { name: "Manage content" })).toHaveAttribute("href", "/admin");
      expect(nav.getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/admin/analytics");
      expect(nav.getByRole("link", { name: "Blog posts" })).toHaveAttribute("href", "/admin/blog");
    });

    it("moves focus to the first item when opened: a link for an Admin, Sign out for a Visitor", async () => {
      const { unmount } = render(<AuthControls session={admin} onSignOut={jest.fn()} />);
      await userEvent.click(trigger());
      expect(screen.getByRole("link", { name: "Manage content" })).toHaveFocus();
      unmount();

      render(<AuthControls session={{ user: { name: "Guest" }, role: "Visitor" }} onSignOut={jest.fn()} />);
      await userEvent.click(trigger());
      expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus();
    });

    it("gives a Visitor no admin links", async () => {
      render(<AuthControls session={{ user: { name: "Guest", email: "guest@example.com" }, role: "Visitor" }} onSignOut={jest.fn()} />);

      await userEvent.click(trigger());

      expect(screen.getByText("Visitor")).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Admin" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Manage content" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    });

    it("signs out from the menu and closes it", async () => {
      const onSignOut = jest.fn();
      render(<AuthControls session={admin} onSignOut={onSignOut} />);

      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    });

    it("closes with Escape, returning focus to the avatar, and on an outside click", async () => {
      render(<AuthControls session={admin} onSignOut={jest.fn()} />);

      await userEvent.click(trigger());
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();

      await userEvent.click(trigger());
      await userEvent.click(document.body);
      expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    });

    it("uses the profile picture, and falls back to initials if it fails to load", () => {
      const { container } = render(<AuthControls session={admin} onSignOut={jest.fn()} />);

      const image = container.querySelector("img")!;
      expect(image).toHaveAttribute("src", "https://lh3.googleusercontent.com/a/photo");
      expect(image).toHaveAttribute("referrerpolicy", "no-referrer");

      fireEvent.error(image);
      expect(container.querySelector("img")).toBeNull();
      expect(within(trigger()).getByText("KK")).toBeInTheDocument();
    });

    it("shows initials when there is no picture and falls back to the email when there is no name", () => {
      const { container, rerender } = render(<AuthControls session={{ user: { name: "Owner", email: "o@example.com" }, role: "Admin" }} onSignOut={jest.fn()} />);
      expect(container.querySelector("img")).toBeNull();
      expect(within(trigger()).getByText("O")).toBeInTheDocument();

      rerender(<AuthControls session={{ user: { email: "zed@example.com" }, role: "Visitor" }} onSignOut={jest.fn()} />);
      expect(trigger()).toHaveAccessibleName("Account menu, signed in as zed@example.com");
      expect(within(trigger()).getByText("Z")).toBeInTheDocument();
    });
  });

  describe("initialsOf", () => {
    it("takes up to two initials from the name, else the first letter of the email, else a placeholder", () => {
      expect(initialsOf("karan kaushik khatri")).toBe("KK");
      expect(initialsOf("  Owner ")).toBe("O");
      expect(initialsOf("", "zed@example.com")).toBe("Z");
      expect(initialsOf(null, null)).toBe("?");
    });
  });
});
