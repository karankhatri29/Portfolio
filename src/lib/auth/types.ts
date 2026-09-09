export type Role = "Admin" | "Visitor";

export type PortfolioSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  role: Role;
};
