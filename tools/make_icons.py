from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "assets"
OUT.mkdir(parents=True, exist_ok=True)

MASTER = 512
font_path = Path("C:/Windows/Fonts/segoeuib.ttf")
font = (
    ImageFont.truetype(str(font_path), 300)
    if font_path.exists()
    else ImageFont.load_default(size=300)
)

for size in (16, 32, 48, 128):
    image = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, MASTER - 1, MASTER - 1), radius=96, fill=(25, 27, 49, 255))
    draw.rounded_rectangle(
        (18, 18, MASTER - 19, MASTER - 19),
        radius=82,
        outline=(245, 243, 194, 130),
        width=6,
    )
    box = draw.textbbox((0, 0), "G", font=font)
    x = (MASTER - (box[2] - box[0])) / 2 - box[0]
    y = (MASTER - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), "G", font=font, fill=(245, 243, 194, 255))

    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    target = OUT / f"icon-{size}.png"
    resized.save(target)
    print(f"wrote {target}")
