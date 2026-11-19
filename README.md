<p align="center">
  <img src="docs/icon.png" alt="NovelAI Hotkeys icon: a hand pressing a button" width="112">
</p>

<p align="center">
  <img src="docs/hero.png" alt="One-Handed NovelAI: keyboard control for NovelAI" width="100%">
</p>

<h1 align="center">NovelAI Hotkeys</h1>

<p align="center">Generate an image, download it, and get back to the prompt without leaving the keyboard.</p>

<p align="center">
  <a href="https://github.com/apoapostolov/novelai-hotkeys/releases/latest"><img src="https://img.shields.io/github/v/release/apoapostolov/novelai-hotkeys" alt="Latest stable release version"></a>
  <a href="https://github.com/apoapostolov/novelai-hotkeys/releases/latest"><img src="https://img.shields.io/github/release-date/apoapostolov/novelai-hotkeys?display_date=published_at&amp;label=last%20release" alt="Last release date"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions"><img src="https://img.shields.io/badge/type-browser%20extension-purple" alt="Browser extension"></a>
  <a href="https://www.mozilla.org/firefox/new/"><img src="https://img.shields.io/badge/Firefox-140%2B-orange" alt="Firefox 140 or newer"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

NovelAI Hotkeys puts the three actions you repeat most on three keys. Press `Z` to generate the next image, `X` to download the newest one, and `C` to put the cursor back in the prompt. The extension runs only on `novelai.net/image` and does not touch other sites.

Every binding is changeable in the toolbar popup. You can also add a fourth shortcut that downloads the whole latest batch, and decide whether downloads ask for a location.

## Settings

![The NovelAI Hotkeys popup with the C, Z and X bindings and the advanced selector fields](docs/settings-1.0.0.png)

The popup opens from the toolbar icon. Click a key box and press a key to rebind it, hold a modifier if you want one, or press Esc to turn the shortcut off.

| Default key | Action |
| --- | --- |
| `C` | Focus the prompt field |
| `Z` | Click Generate to produce the next image |
| `X` | Download the newest generated image |
| Off | Download up to four images from the latest batch, when bound |

Shortcuts do not fire while you are typing in a prompt, input, select or contenteditable region, so writing a prompt never sends an accidental generate or download.

## Install

The 1.0.0 xpi is attached to the [release](https://github.com/apoapostolov/novelai-hotkeys/releases/tag/v1.0.0). It is built locally and is not signed by Mozilla, so Firefox will not install it from a normal download link.

For a temporary load:

1. Download the source from this repository and keep the folder.
2. Open `about:debugging` in Firefox.
3. Choose **This Firefox**, then **Load Temporary Add-on**.
4. Select `manifest.json` in the project folder.

The add-on unloads when Firefox closes. For a permanent install, set `user_pref("xpinstall.signatures.required", false);` in the profile's `user.js`, then open the xpi as a local file and restart Firefox.

## Customize

The popup has four controls beyond the key bindings: a master switch, the typing guard, the action toast, and **Ask where to save**. Changes apply to open tabs immediately.

NovelAI changes its markup from time to time. The Advanced fields let you point the extension at the right elements with a CSS selector:

- **Generate button selector** finds the button that starts a generation.
- **Image selector** finds the result images.
- **Prompt field selector** finds the prompt input.

Leave a field blank to use automatic detection. Detection picks the visible button whose text starts with `Generate`, result images from `img` elements backed by data URLs, blob URLs or novelai.net CDN URLs, and the prompt field from a text input or contenteditable region whose label or placeholder mentions `prompt`. Icons and SVGs are ignored.

## How it works

`content.js` listens for the keys and finds NovelAI's controls. Images served as data or blob URLs are downloaded from the page; remote images go through `background.js` to `browser.downloads.download`. Settings are stored with `browser.storage.local` under the `settings` key.

## Development

Run `node tests/harness.mjs` to exercise the shipped scripts against stub browser APIs, and `python tools/build_xpi.py` to build the xpi. The icons are exported from `assets/icon-source.png` with `python tools/prepare_icon.py`, and the hero comes from `python tools/make_hero.py` using the captured settings shot. `docs/screenshots.md` records where each image came from and how to retake it.

## License

[MIT](LICENSE).

