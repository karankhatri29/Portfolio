import { render, screen } from "@testing-library/react";

import { AdminGate } from "@/components/AdminGate";

const adminSession = { user: { name: "Owner", email: "owner@example.com" }, role: "Admin" as const };
const visitorSession = { user: { name: "Visitor", email: "visitor@example.com" }, role: "Visitor" as const };

describe("AdminGate", () => {
  it("renders protected content for Admin sessions", () => {
    render(
      <AdminGate session={adminSession}>
        <p>Editor controls</p>
      </AdminGate>,
    );

    expect(screen.getByText("Editor controls")).toBeInTheDocument();
  });

  it("does not render protected content for Visitor sessions", () => {
    render(
      <AdminGate session={visitorSession}>
        <p>Editor controls</p>
      </AdminGate>,
    );

    expect(screen.queryByText("Editor controls")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Admin access required/i);
  });

  it("asks unauthenticated users to sign in", () => {
    render(
      <AdminGate session={null}>
        <p>Editor controls</p>
      </AdminGate>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/sign in/i);
  });
});
