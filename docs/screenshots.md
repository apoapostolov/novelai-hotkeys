# Screenshot and asset provenance

Every image in this repository comes from the real project or from a reproducible generator. No generated image claims to be product UI.

| File | Surface and exact state | Size | Version | Reproduce |
| --- | --- | --- | --- | --- |
| `docs/icon.png` | The approved hand-pressing-a-button mark from image candidate 2, kept as a 1024px master in `assets/icon-source.png` | 512 x 512 | 1.0.0 | `python3 tools/prepare_icon.py`, then copy `assets/icon-512.png` |
| `docs/settings-1.0.0.png` | The toolbar popup opened from `popup.html` with default settings: hotkeys on, typing guard on, toast on, ask-where-to-save off, bindings C / Z / X and batch off. No account data appears. | 760 x 1440 (380 x 720 CSS at 2x) | 1.0.0 | Open `popup.html` in a browser at a 380 x 720 viewport with device scale 2, then capture the viewport |
| `docs/hero.png` | Marketing banner with the approved headline and a crop of the real shortcuts section from the settings capture | 1280 x 640 | 1.0.0 | `python3 tools/make_hero.py`, after `docs/settings-1.0.0.png` exists |

The hero lockup was approved before compositing: `One-Handed NovelAI` and `Keyboard control for NovelAI.` Both passed the copy gate at 18/28 and 29/40 characters.

When the popup changes, retake the screenshot into a versioned filename and update the README and this table together. The hero generator reads the screenshot path directly, so keep `docs/settings-1.0.0.png` available for this release.
