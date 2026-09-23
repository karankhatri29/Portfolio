import { absoluteUrl, siteUrl, socialProfiles } from "@/lib/site";

const env = process.env as Record<string, string | undefined>;
const saved = { site: env.NEXT_PUBLIC_SITE_URL, vercel: env.VERCEL_PROJECT_PRODUCTION_URL };

afterEach(() => {
  env.NEXT_PUBLIC_SITE_URL = saved.site;
  env.VERCEL_PROJECT_PRODUCTION_URL = saved.vercel;
});

describe("siteUrl", () => {
  it("prefers the configured URL and trims trailing slashes", () => {
    env.NEXT_PUBLIC_SITE_URL = "https://karan.dev///";
    env.VERCEL_PROJECT_PRODUCTION_URL = "ignored.vercel.app";

    expect(siteUrl()).toBe("https://karan.dev");
  });

  it("falls back to the Vercel production host, then localhost", () => {
    delete env.NEXT_PUBLIC_SITE_URL;
    env.VERCEL_PROJECT_PRODUCTION_URL = "my-portfolio.vercel.app";
    expect(siteUrl()).toBe("https://my-portfolio.vercel.app");

    delete env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl and socialProfiles", () => {
  it("joins paths and lists only real profile links", () => {
    env.NEXT_PUBLIC_SITE_URL = "https://karan.dev";

    expect(absoluteUrl("/blog")).toBe("https://karan.dev/blog");
    expect(absoluteUrl("blog")).toBe("https://karan.dev/blog");
    expect(socialProfiles().every((url) => url.startsWith("https://"))).toBe(true);
    expect(socialProfiles().some((url) => url.startsWith("mailto:"))).toBe(false);
  });
});
