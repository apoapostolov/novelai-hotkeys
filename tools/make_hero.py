from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SHOT = ROOT / "docs" / "settings-1.0.0.png"
OUT = ROOT / "docs" / "hero.png"

WIDTH, HEIGHT = 1280, 640
BG = (15, 17, 32, 255)
ACCENT = (245, 243, 194, 255)
WHITE = (255, 255, 255, 255)
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"


def fit_font(text, path, max_width, start_size, min_size=18):
    size = start_size
    while size >= min_size:
        font = ImageFont.truetype(path, size)
        if font.getlength(text) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(path, min_size)


image = Image.new("RGBA", (WIDTH, HEIGHT), BG)
draw = ImageDraw.Draw(image)

icon = Image.open(ROOT / "docs" / "icon.png").convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
image.alpha_composite(icon, (72, 88))

draw.rounded_rectangle((72, 214, 168, 218), radius=2, fill=ACCENT)

line_one = "One-Handed NovelAI"
line_two = "Keyboard control for NovelAI."
font_one = fit_font(line_one, FONT_BOLD, 420, 52)
font_two = fit_font(line_two, FONT_BOLD, 420, 52)
draw.text((72, 246), line_one, font=font_one, fill=WHITE)
draw.text((72, 318), line_two, font=font_two, fill=WHITE)

panel = (520, 120, 1244, 512)
draw.rounded_rectangle(panel, radius=18, outline=ACCENT, width=6)

shot = Image.open(SHOT).convert("RGBA")
shot = shot.crop((0, 360, 760, 766))
shot = shot.resize((panel[2] - panel[0] - 12, panel[3] - panel[1] - 12), Image.Resampling.LANCZOS)

mask = Image.new("L", shot.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, shot.width - 1, shot.height - 1), radius=12, fill=255)
image.paste(shot, (panel[0] + 6, panel[1] + 6), mask)

image.convert("RGB").save(OUT, optimize=True)
print(f"wrote {OUT} ({WIDTH}x{HEIGHT})")
