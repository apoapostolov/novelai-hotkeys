from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon-source.png"
SIZES = (16, 32, 48, 128, 256, 512)


def build():
    master = Image.open(SOURCE).convert("RGB")
    width, height = master.size
    side = min(width, height)
    master = master.crop(
        ((width - side) // 2, (height - side) // 2, (width + side) // 2, (height + side) // 2)
    ).resize((1024, 1024), Image.Resampling.LANCZOS)
    master.save(SOURCE, optimize=True)

    for size in SIZES:
        image = master.resize((size, size), Image.Resampling.LANCZOS)
        if size <= 48:
            image = image.filter(ImageFilter.UnsharpMask(radius=0.6, percent=110, threshold=2))
        target = ROOT / "assets" / f"icon-{size}.png"
        image.save(target, optimize=True)
        if size == 512:
            image.save(ROOT / "docs" / "icon.png", optimize=True)
        print(f"{target.name}: {image.size[0]}x{image.size[1]}, mode {image.mode}")


if __name__ == "__main__":
    build()
