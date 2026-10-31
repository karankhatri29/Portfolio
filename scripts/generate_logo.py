#!/usr/bin/env python3
"""Generate the K³ brand logo (SVG + PNG + ICO) from code.

The logo is a faceted wireframe "K" with a network of nodes, a hexagon with a hub
behind the arms, and a glowing superscript 3. Everything is defined as data below,
in a 900x835 design space, so the artwork can be tweaked and regenerated.

Usage:
    python scripts/generate_logo.py                # writes public/brand/k3/*
    python scripts/generate_logo.py --out some/dir
    python scripts/generate_logo.py --no-png       # SVG only

PNG/ICO export needs Pillow and a Chromium-based browser (Chrome or Edge); the SVGs
need nothing. The app serves public/brand/k3/logo-k3.svg directly.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# ---------------------------------------------------------------- palette
BG = "#181f27"
CYAN = "#19f5fa"
MID = "#4d9fea"
VIOLET = "#5a70ec"
FILL_TOP = "#21556e"
FILL_BOTTOM = "#2c4b78"

# ---------------------------------------------------------------- geometry (design space)
# A square canvas that centres the artwork: viewBox x0 y0 w h
VIEWBOX = (9, -3, 900, 900)

A, B, C, D = (115, 190), (293, 97), (115, 700), (293, 800)  # stem prism corners
P1, P2 = (425, 198), (647, 198)  # upper arm top edge
V = (440, 437)  # chevron vertex
T, Q = (665, 715), (440, 705)  # lower arm tip / lower-left corner
N1, N2, N3 = (205, 252), (207, 437), (205, 640)  # spine nodes
N4, N5, N6 = (468, 270), (488, 630), (335, 437)  # arm nodes
HUB = (585, 440)

# (x1, y1, x2, y2, width, opacity)
OUTER = 14
INNER = 9.5
DIM = 9


def seg(p, q, w=INNER, o=1.0):
    return (p[0], p[1], q[0], q[1], w, o)


LINES = [
    # frame
    seg(A, C, OUTER), seg(A, B, OUTER), seg(B, (293, 352), OUTER), seg(C, D, OUTER),
    seg(P1, P2, OUTER), seg(P2, V, OUTER), seg(V, T, OUTER), seg(T, Q, OUTER), seg(N2, P1, OUTER),
    # spine
    seg(A, N1), seg(N1, B), seg(N1, N3), seg(N2, C), seg(N3, C), seg(N3, D),
    # arms
    seg(N2, N4), seg(N4, P2), seg(P1, N4), seg(N6, N4), seg(N2, V), seg(N6, N5), seg(N2, N5),
    seg(N5, T), seg(N5, Q), seg((293, 520), D), seg((293, 520), Q),
    # receding edges
    seg(B, P1, DIM, 0.45), seg(D, (420, 712), DIM, 0.5),
    # hexagon + hub spokes
    seg((565, 300), (690, 355), DIM, 0.85), seg((690, 355), (692, 520), INNER, 1.0), seg((692, 520), (585, 586), DIM, 0.85),
    seg(HUB, (684, 376), DIM, 0.75), seg(HUB, (681, 513), DIM, 0.75), seg(HUB, (574, 585), DIM, 0.7),
    seg(HUB, (568, 304), DIM, 0.6), seg(HUB, (500, 392), DIM, 0.4), seg(HUB, (502, 495), DIM, 0.45),
]

# (cx, cy, r, opacity)
NODES = [
    (*N1, 27, 1), (*N2, 25, 1), (*N3, 24, 1), (*N4, 26, 1), (*N5, 25, 1), (*N6, 25, 1), (*HUB, 24, 0.9),
]

# translucent facets (polygon points, gradient id)
FACETS = [
    ([A, N1, N3, C], "facetStem"),
    ([A, B, N1], "facetStemTop"),
    ([N2, P1, N4], "facetBand"),
    ([N2, N4, N6], "facetBand"),
    ([N6, V, T, N5], "facetBandLow"),
]

# The superscript 3, drawn as a stroked path (flat top bar, round bowl).
THREE = "M 678 127 H 786 L 737 191 C 783 191 798 217 798 236 C 798 263 772 277 740 277 C 712 277 690 269 676 253"
THREE_WIDTH = 39


def poly(points):
    return " ".join(f"{x},{y}" for x, y in points)


def build_svg(tile: bool = True, rounded: bool = True) -> str:
    x0, y0, w, h = VIEWBOX
    parts: list[str] = []
    add = parts.append
    add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">')
    add('<title id="t">Karan Kaushik Khatri</title>')
    add("<defs>")
    add(f'<linearGradient id="ink" gradientUnits="userSpaceOnUse" x1="0" y1="95" x2="0" y2="805"><stop offset="0" stop-color="{CYAN}"/><stop offset="0.42" stop-color="#3fcdee"/><stop offset="0.68" stop-color="{MID}"/><stop offset="1" stop-color="{VIOLET}"/></linearGradient>')
    add(f'<linearGradient id="facetStem" gradientUnits="userSpaceOnUse" x1="0" y1="190" x2="0" y2="700"><stop offset="0" stop-color="#1f4661" stop-opacity="0.95"/><stop offset="0.55" stop-color="#1a3250" stop-opacity="0.6"/><stop offset="1" stop-color="#141b2d" stop-opacity="0.1"/></linearGradient>')
    add('<linearGradient id="facetStemTop" gradientUnits="userSpaceOnUse" x1="0" y1="97" x2="0" y2="260"><stop offset="0" stop-color="#1c5068" stop-opacity="0.9"/><stop offset="1" stop-color="#1f4661" stop-opacity="0.7"/></linearGradient>')
    add(f'<linearGradient id="facetBand" gradientUnits="userSpaceOnUse" x1="0" y1="198" x2="0" y2="437"><stop offset="0" stop-color="{FILL_TOP}" stop-opacity="0.85"/><stop offset="1" stop-color="{FILL_TOP}" stop-opacity="0.95"/></linearGradient>')
    add(f'<linearGradient id="facetBandLow" gradientUnits="userSpaceOnUse" x1="0" y1="437" x2="0" y2="715"><stop offset="0" stop-color="#2a5273" stop-opacity="0.95"/><stop offset="1" stop-color="{FILL_BOTTOM}" stop-opacity="0.95"/></linearGradient>')
    add('<linearGradient id="threeInk" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="290"><stop offset="0" stop-color="#37fbf3"/><stop offset="0.5" stop-color="#62fbff"/><stop offset="1" stop-color="#79defd"/></linearGradient>')
    add('<radialGradient id="aura" gradientUnits="userSpaceOnUse" cx="738" cy="205" r="215"><stop offset="0" stop-color="#2fd6e6" stop-opacity="0.5"/><stop offset="0.45" stop-color="#2a8fa8" stop-opacity="0.22"/><stop offset="1" stop-color="#2a8fa8" stop-opacity="0"/></radialGradient>')
    add('<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>')
    add("</defs>")

    if tile:
        rx = 150 if rounded else 0
        add(f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{rx}" fill="{BG}"/>')
    add('<circle cx="738" cy="205" r="215" fill="url(#aura)"/>')

    for points, gradient in FACETS:
        add(f'<polygon points="{poly(points)}" fill="url(#{gradient})"/>')

    add('<g stroke="url(#ink)" stroke-linecap="round" stroke-linejoin="round" fill="none">')
    for x1, y1, x2, y2, width, opacity in LINES:
        extra = f' stroke-opacity="{opacity}"' if opacity < 1 else ""
        add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke-width="{width}"{extra}/>')
    add("</g>")

    add('<g fill="url(#ink)">')
    for cx, cy, r, opacity in NODES:
        extra = f' fill-opacity="{opacity}"' if opacity < 1 else ""
        add(f'<circle cx="{cx}" cy="{cy}" r="{r}"{extra}/>')
    add("</g>")

    add(f'<path d="{THREE}" fill="none" stroke="#37fbf3" stroke-width="{THREE_WIDTH + 14}" stroke-linejoin="miter" filter="url(#soft)" opacity="0.55"/>')
    add(f'<path d="{THREE}" fill="none" stroke="url(#threeInk)" stroke-width="{THREE_WIDTH}" stroke-linejoin="miter"/>')
    add("</svg>")
    return "".join(parts)


# ---------------------------------------------------------------- export helpers
def find_browser() -> str | None:
    candidates = [
        os.environ.get("CHROME_PATH", ""),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for path in candidates:
        if path and Path(path).exists():
            return path
    return shutil.which("chrome") or shutil.which("chromium") or shutil.which("msedge")


def render_png(browser: str, svg_path: Path, png_path: Path, size: int) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "page.html"
        html.write_text(
            f'<!doctype html><meta charset="utf-8"><style>html,body{{margin:0;background:transparent}}'
            f'img{{display:block;width:{size}px;height:{size}px}}</style><img src="{svg_path.resolve().as_uri()}">',
            encoding="utf-8",
        )
        subprocess.run(
            [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
             f"--window-size={size},{size}", "--force-device-scale-factor=1", f"--screenshot={png_path}", html.as_uri()],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120,
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "public" / "brand" / "k3"))
    parser.add_argument("--no-png", action="store_true", help="write the SVG files only")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    files = {
        "logo-k3.svg": build_svg(tile=True),
        "logo-k3-mark.svg": build_svg(tile=False),
        "logo-k3-square.svg": build_svg(tile=True, rounded=False),
    }
    for name, content in files.items():
        (out / name).write_text(content, encoding="utf-8")
        print("wrote", out / name)

    ts = Path(__file__).resolve().parent.parent / "src" / "lib" / "brand-k3.generated.ts"
    if ts.parent.exists() and out.name == "k3":
        svg_literal = json.dumps(build_svg(tile=True))
        ts.write_text(
            "// Generated by scripts/generate_logo.py. Do not edit by hand.\n"
            f"export const K3_LOGO_SVG = {svg_literal};\n\n"
            "export function k3LogoDataUri(): string {\n"
            "  return `data:image/svg+xml;base64,${Buffer.from(K3_LOGO_SVG).toString('base64')}`;\n"
            "}\n",
            encoding="utf-8",
        )
        print("wrote", ts)

    if args.no_png:
        return 0

    browser = find_browser()
    if not browser:
        print("No Chrome/Edge found: skipped PNG export (set CHROME_PATH to enable).", file=sys.stderr)
        return 0

    for size in (1024, 512, 192, 180, 48, 32):
        target = out / f"logo-k3-{size}.png"
        render_png(browser, out / "logo-k3.svg", target, size)
        print("wrote", target)

    try:
        from PIL import Image

        icon = Image.open(out / "logo-k3-512.png").convert("RGBA")
        icon.save(out / "favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)])
        print("wrote", out / "favicon.ico")
    except ImportError:
        print("Pillow not installed: skipped favicon.ico", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
