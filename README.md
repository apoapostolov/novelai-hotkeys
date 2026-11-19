# NovelAI Hotkeys

A Firefox extension for `https://novelai.net/image`. One key generates the next image and another saves it. Both bindings are changeable from the toolbar popup.

## Install

Temporary load, no signing needed:

1. Open `about:debugging` in Firefox.
2. Choose **This Firefox**, then **Load Temporary Add-on**.
3. Select `manifest.json` in this folder.

The add-on is removed when Firefox closes.

Permanent install:

1. Run `python tools/build_xpi.py` to build `novelai-hotkeys-1.0.0.xpi`.
2. Add `user_pref("xpinstall.signatures.required", false);` to `user.js` in the target profile.
3. Copy the xpi to that profile's `extensions/` folder as `novelai-hotkeys@apoapostolov.xpi` and restart Firefox.

The signature preference is only needed for locally built, unsigned xpi files.

## Use

- `C` focuses the prompt field, ready for typing.
- `Z` clicks the Generate button, producing the next image.
- `X` downloads the newest generated image to the normal download folder.
- **Download whole batch** is off by default. Bind it in the popup to download up to the four newest images at once.

All three bindings are configurable in the popup: click a key box, press a new key, optionally hold a modifier, or press Esc to disable it.

Shortcuts do not fire while typing in prompt fields, inputs, selects or contenteditable regions.

## Customize

Click the toolbar icon. Each of the three actions has a key box: click it, press the key you want, and optionally hold Ctrl, Alt, Shift or Meta. Press Esc or the **Off** button to disable a binding. The popup also has toggles for enabling hotkeys, the typing guard, the action toast and the ask-where-to-save download option. Changes apply immediately to open tabs.

If NovelAI changes its markup, the two Advanced fields accept CSS selectors:

- **Generate button selector** points at the Generate button.
- **Image selector** points at the result images.
- **Prompt field selector** points at the prompt text input.

Leave any of them blank for automatic detection. Detection picks the visible button whose text starts with `Generate`, result images from `img` elements backed by data URLs, blob URLs or novelai.net CDN URLs, and the prompt field from text inputs or contenteditable regions whose label or placeholder mentions `prompt`. Icons and SVGs are ignored.

## How it works

`content.js` holds the hotkey listener and the button and image detection. Data and blob images are saved from the page with an anchor download; remote images are passed to `background.js`, which calls `browser.downloads.download`. Settings live in `browser.storage.local` under the `settings` key.

## Files

- `manifest.json`: MV3 manifest, gecko id `novelai-hotkeys@apoapostolov`
- `content.js`, `content.css`: page-side logic and toast
- `background.js`: download bridge
- `popup.html`, `popup.js`, `popup.css`: settings UI
- `assets/`: toolbar and manifest icons
- `tools/make_icons.py`: regenerates icons from the master drawing
- `tools/build_xpi.py`: packages the signed-ready xpi
- `tests/harness.mjs`: executes the shipped scripts against stub browser APIs

Version 1.0.0.
