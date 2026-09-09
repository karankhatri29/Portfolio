import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthControls } from "@/components/AuthControls";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("AuthControls", () => {
  it("offers Google and GitHub when signed out", async () => {
    const onSignIn = jest.fn();
    render(<AuthControls session={null} onSignIn={onSignIn} />);

    await userEvent.click(screen.getByRole("button", { name: /sign in with GitHub/i }));

    expect(screen.getByRole("button", { name: /sign in with Google/i })).toBeInTheDocument();
    expect(onSignIn).toHaveBeenCalledWith("github");
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
