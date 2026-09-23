import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImageUploadButton } from "@/components/ImageUploadButton";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const chooseFile = async (user: ReturnType<typeof userEvent.setup>, name = "shot.png") => {
  await user.upload(screen.getByLabelText("Upload image", { selector: "input" }), new File(["x"], name, { type: "image/png" }));
};

describe("ImageUploadButton", () => {
  it("uploads the chosen file and reports the hosted address", async () => {
    const user = userEvent.setup();
    const onUploaded = jest.fn();
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ url: "https://cdn.example.com/shot.png" }) });
    render(<ImageUploadButton onUploaded={onUploaded} />);

    await chooseFile(user);

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith("https://cdn.example.com/shot.png", "shot.png"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("shows a busy state while uploading", async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<ImageUploadButton onUploaded={jest.fn()} />);

    await chooseFile(user);

    expect(await screen.findByRole("button", { name: "Uploading..." })).toBeDisabled();
    finish({ ok: true, status: 201, json: async () => ({ url: "https://cdn.example.com/a.png" }) });
    expect(await screen.findByRole("button", { name: "Upload image" })).toBeEnabled();
  });

  it("shows the server's explanation, such as storage not being set up, and never calls back", async () => {
    const user = userEvent.setup();
    const onUploaded = jest.fn();
    fetchMock.mockResolvedValue({ ok: false, status: 501, json: async () => ({ error: "Image uploads are not set up yet." }) });
    render(<ImageUploadButton onUploaded={onUploaded} />);

    await chooseFile(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Image uploads are not set up yet.");
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("handles network failures kindly", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<ImageUploadButton onUploaded={jest.fn()} />);

    await chooseFile(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });
});
