import { render } from "@testing-library/react";

import { JsonLd, serializeJsonLd } from "@/components/JsonLd";

describe("JsonLd", () => {
  it("renders parseable structured data", () => {
    const { container } = render(<JsonLd data={{ "@type": "Person", name: "Ada" }} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML)).toEqual({ "@type": "Person", name: "Ada" });
  });

  it("cannot be broken out of with a closing script tag", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(text).not.toContain("</script>");
    expect(JSON.parse(text).name).toBe("</script><script>alert(1)</script>");
  });
});
