"""Bake the Home hero title from Segoe Print Bold outlines with a pen-reveal animation.

The pen mask is derived automatically from each glyph's own outline, so the title can
be changed by editing TITLE alone. The huge stroke width makes the outline band cover
the glyph while it is being drawn, which reads as handwriting rather than an outline trace.
"""

import argparse
import hashlib
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


TITLE = "Am1ya Lab"
SCALE = 11 / 256
STROKE_WIDTH = 620
BASELINE = 94
PADDING = 7
PREVIOUS_ASSET_SHA256 = "fe78e689b639c8508bd6b252a991694278ca3dad87773107151e9f80adfc62b6"


def build_svg(font_path: Path) -> str:
    font = TTFont(font_path)
    if font["head"].unitsPerEm != 2048:
        raise ValueError("Expected the Segoe Print Bold 2048-unit outlines")
    families = {name.toUnicode() for name in font["name"].names if name.nameID == 1}
    if "Segoe Print" not in families:
        raise ValueError("Expected Segoe Print Bold, not another font family")
    weights = {name.toUnicode() for name in font["name"].names if name.nameID == 2}
    if "Bold" not in weights:
        raise ValueError("Expected the original bold title weight")

    glyph_set = font.getGlyphSet()
    names = font.getBestCmap()
    advances = font["hmtx"]

    outlines: dict[str, str] = {}
    ink_boxes: dict[str, tuple[float, float, float, float]] = {}
    for character in dict.fromkeys(TITLE.replace(" ", "")):
        if ord(character) not in names:
            raise ValueError(f"Segoe Print Bold has no glyph for {character!r}")
        pen = SVGPathPen(glyph_set)
        glyph_set[names[ord(character)]].draw(pen)
        outlines[character] = pen.getCommands()

        bounds = BoundsPen(glyph_set)
        glyph_set[names[ord(character)]].draw(bounds)
        ink_boxes[character] = bounds.bounds or (0.0, 0.0, 0.0, 0.0)

    definitions = [f'<path id="glyph-{c}" d="{d}"/>' for c, d in outlines.items()]
    groups = []
    cursor = 4.0
    order = 0
    min_x = max_x = cursor
    min_y = max_y = float(BASELINE)

    for index, character in enumerate(TITLE):
        advance = advances[names[ord(character)]][0] * SCALE
        if character == " ":
            cursor += advance
            continue

        x_min, y_min, x_max, y_max = ink_boxes[character]
        min_x = min(min_x, cursor + x_min * SCALE)
        max_x = max(max_x, cursor + x_max * SCALE)
        # glyph space is y-up; the SVG group flips it around the baseline
        min_y = min(min_y, BASELINE - y_max * SCALE)
        max_y = max(max_y, BASELINE - y_min * SCALE)

        pen = (
            f'<path class="pen" d="{outlines[character]}" pathLength="1" fill="none" '
            f'stroke="#fff" stroke-width="{STROKE_WIDTH}" stroke-linecap="round" '
            f'stroke-linejoin="round" style="animation-delay:{order * 68}ms"/>'
        )
        order += 1
        definitions.append(
            f'<mask id="pen-{index}" maskUnits="userSpaceOnUse" '
            f'x="-600" y="-600" width="3600" height="3600">{pen}</mask>'
        )
        groups.append(
            f'<g transform="translate({cursor:.3f} {BASELINE}) scale({SCALE} -{SCALE})">'
            f'<use href="#glyph-{character}" mask="url(#pen-{index})" '
            f'fill="#465575" stroke="#fff" stroke-width="100" '
            f'stroke-linejoin="round" paint-order="stroke fill"/></g>'
        )
        cursor += advance

    view_x = round(min_x - PADDING, 3)
    view_y = round(min_y - PADDING, 3)
    view_w = round(max_x - min_x + PADDING * 2, 3)
    view_h = round(max_y - min_y + PADDING * 2, 3)

    style = (
        "<style>"
        ".pen{stroke-dasharray:1 1;animation:write 170ms linear both}"
        "@keyframes write{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}"
        "@media(prefers-reduced-motion:reduce){.pen{animation:none}}"
        "</style>"
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_x} {view_y} {view_w} {view_h}" '
        f'width="{view_w}" height="{view_h}">{style}<defs>{"".join(definitions)}</defs>'
        f'{"".join(groups)}</svg>\n'
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", type=Path, default=Path(r"C:\Windows\Fonts\segoeprb.ttf"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[4]
        / "public/themes/fuyukawa-kagari/assets/hero-title.svg",
    )
    parser.add_argument("--force", action="store_true", help="overwrite hand-edited lettering")
    args = parser.parse_args()

    svg = build_svg(args.font)

    if args.output.exists():
        if args.output.read_text(encoding="utf-8") != svg:
            digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
            if digest != PREVIOUS_ASSET_SHA256 and not args.force:
                raise FileExistsError(
                    f"Different lettering already exists: {args.output} (use --force)"
                )

    args.output.write_text(svg, encoding="utf-8", newline="\n")
    print(f"{args.output}: {len(svg.encode('utf-8'))} bytes")


if __name__ == "__main__":
    main()
