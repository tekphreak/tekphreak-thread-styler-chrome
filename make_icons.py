#!/usr/bin/env python3
"""Regenerate icons/icon{16,32,48,128}.png.

Design: black rounded-square plate with a HUGE #525252 "@" behind the label (the "@"
is larger than the plate, so it bleeds off the edges) and the label in #F2F2F2 bold
italic on top.
  * 48/128 px: the word STYLE.
  * 16 and 32 px: a single big "S" -- five letters are not legible that small.
Each icon is drawn at 1024px and downscaled with Lanczos so edges stay as crisp as
possible.

Needs Pillow and the DejaVu Sans fonts (fonts-dejavu-core on Debian/Ubuntu).
Run from the repo root:  python3 make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
AT_FONT = FONT_DIR / "DejaVuSans-Bold.ttf"
WORD_FONT = FONT_DIR / "DejaVuSans-BoldOblique.ttf"

PLATE = (0, 0, 0, 255)                # same plate as the original icon
AT_COLOR = (0x52, 0x52, 0x52, 255)    # #525252
WORD_COLOR = (0xF2, 0xF2, 0xF2, 255)  # #F2F2F2

MASTER = 1024
AT_SCALE = 1.28        # "@" width as a multiple of the plate: >1 means it bleeds off the edges
WORD_FILL = 0.88       # STYLE width as a fraction of the plate
LETTER_HEIGHT = 0.80   # single "S" cap height as a fraction of the plate (16px icon)

# (pixel size, text drawn over the "@")
ICONS = ((16, "S"), (32, "S"), (48, "STYLE"), (128, "STYLE"))


def fit_width(path, text, target_w, tracking_px=0):
    """Largest font whose rendered `text` (plus tracking) is <= target_w wide."""
    lo, hi = 8, 3000
    while lo < hi:
        mid = (lo + hi + 1) // 2
        font = ImageFont.truetype(str(path), mid)
        l, _t, r, _b = font.getbbox(text)
        if (r - l) + tracking_px * (len(text) - 1) <= target_w:
            lo = mid
        else:
            hi = mid - 1
    return ImageFont.truetype(str(path), lo)


def fit_height(path, text, target_h):
    """Largest font whose rendered `text` is <= target_h tall."""
    lo, hi = 8, 3000
    while lo < hi:
        mid = (lo + hi + 1) // 2
        font = ImageFont.truetype(str(path), mid)
        _l, t, _r, b = font.getbbox(text)
        if (b - t) <= target_h:
            lo = mid
        else:
            hi = mid - 1
    return ImageFont.truetype(str(path), lo)


def draw_icon(label):
    # --- the oversized "@", drawn on its own layer so it can be clipped to the plate
    at_layer = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    ad = ImageDraw.Draw(at_layer)
    at_font = fit_width(AT_FONT, "@", MASTER * AT_SCALE)
    l, t, r, b = at_font.getbbox("@")
    ax = (MASTER - (r - l)) / 2 - l
    ay = (MASTER - (b - t)) / 2 - t
    ad.text((ax, ay), "@", font=at_font, fill=AT_COLOR)
    at_center_y = ay + t + (b - t) / 2

    # --- plate, with the "@" clipped to the rounded square
    radius = int(MASTER * 0.22)
    plate_mask = Image.new("L", (MASTER, MASTER), 0)
    ImageDraw.Draw(plate_mask).rounded_rectangle((0, 0, MASTER - 1, MASTER - 1), radius=radius, fill=255)
    img = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    img.paste(Image.new("RGBA", (MASTER, MASTER), PLATE), (0, 0), plate_mask)
    clipped_at = Image.composite(at_layer, Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0)), plate_mask)
    img.alpha_composite(clipped_at)

    # --- label, centred over the "@"
    d = ImageDraw.Draw(img)
    if len(label) == 1:
        font = fit_height(WORD_FONT, label, MASTER * LETTER_HEIGHT)
        wl, wt, wr, wb = font.getbbox(label)
        x = (MASTER - (wr - wl)) / 2 - wl
        y = at_center_y - (wb - wt) / 2 - wt
        d.text((x, y), label, font=font, fill=WORD_COLOR)
    else:
        tracking = int(MASTER * 0.012)
        font = fit_width(WORD_FONT, label, MASTER * WORD_FILL, tracking)
        widths = [font.getlength(c) for c in label]
        total = sum(widths) + tracking * (len(label) - 1)
        _wl, wt, _wr, wb = font.getbbox(label)
        x = (MASTER - total) / 2
        y = at_center_y - (wb - wt) / 2 - wt
        for ch, w in zip(label, widths):
            d.text((x, y), ch, font=font, fill=WORD_COLOR)
            x += w + tracking
    return img


def store_icon(path):
    """Chrome Web Store listing icon: 128x128 canvas, 96x96 artwork, 16px transparent padding."""
    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    canvas.alpha_composite(draw_icon("STYLE").resize((96, 96), Image.LANCZOS), (16, 16))
    canvas.save(path, optimize=True)
    print(f"wrote {path} (store listing icon, STYLE)")


def main():
    import sys
    if len(sys.argv) == 3 and sys.argv[1] == "--store":
        store_icon(Path(sys.argv[2]).expanduser())
        return
    out = Path(__file__).parent / "icons"
    out.mkdir(exist_ok=True)
    for size, label in ICONS:
        draw_icon(label).resize((size, size), Image.LANCZOS).save(out / f"icon{size}.png", optimize=True)
        print(f"wrote {out / f'icon{size}.png'} ({label})")


if __name__ == "__main__":
    main()
