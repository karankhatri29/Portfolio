describe("test environment", () => {
  it("loads Jest with a browser-like DOM and RTL matchers", () => {
    const element = document.createElement("button");
    element.textContent = "Ready";
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("Ready");
  });
});
