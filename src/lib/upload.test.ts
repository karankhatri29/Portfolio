/**
 * @jest-environment node
 */
import { detectImageType, safeUploadName } from "@/lib/upload";

const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("detectImageType", () => {
  it("recognises PNG, JPEG, GIF and WebP from their signatures", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toEqual({ mime: "image/png", ext: "png" });
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ mime: "image/jpeg", ext: "jpg" });
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toEqual({ mime: "image/gif", ext: "gif" });
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]))).toEqual({ mime: "image/webp", ext: "webp" });
  });

  it("rejects SVG, HTML, scripts, RIFF audio and empty files even if the name says image", () => {
    const encode = (text: string) => new TextEncoder().encode(text);

    expect(detectImageType(encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectImageType(encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe("safeUploadName", () => {
  it("builds a clean path from the original name and the detected extension", () => {
    expect(safeUploadName("My Dashboard Screenshot (final).PNG", "png")).toBe("uploads/my-dashboard-screenshot-final.png");
    expect(safeUploadName("../../etc/passwd", "jpg")).toBe("uploads/passwd.jpg");
    expect(safeUploadName("???", "gif")).toBe("uploads/image.gif");
    expect(safeUploadName("C:\\Users\\me\\Pictures\\photo.jpeg", "jpg")).toBe("uploads/photo.jpg");
  });
});
