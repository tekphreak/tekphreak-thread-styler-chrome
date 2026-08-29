# Tekphreak Thread Styler (Chrome)

A Chrome (Manifest V3) port of the Firefox add-on
[Tekphreak Thread Styler](https://addons.mozilla.org/en-US/firefox/addon/tekphreak-thread-styler/).

Adds a floating toolbar to the [Threads](https://www.threads.net) composer.
Select text you're typing in a post or reply, and restyle it as:

- Monospace
- Italic
- Small caps
- Bold italic
- Sans-serif bold
- Normal (removes styling)

Styling is applied using real Unicode characters (Mathematical Alphanumeric
Symbols and IPA/Phonetic Extensions letters), not HTML or CSS, so styled
text renders correctly anywhere Threads displays it — no platform support
required.

## Privacy

This extension collects no data and contacts no servers. It only runs a
content script on `threads.net` / `threads.com` pages and edits text you
select in the composer, entirely within your browser.

## Install (unpacked, for now)

1. Clone this repo.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this repo's folder.
5. Go to threads.net or threads.com, start typing a post or reply, select
   some text, and use the toolbar that appears above your selection.

## Files

- `manifest.json` — MV3 manifest, content script scoped to threads.net/threads.com.
- `content.js` — style tables, selection-triggered toolbar, and the logic
  that writes styled text back into the composer.
- `styles.css` — toolbar styling.
- `icons/` — extension icons.

## License

[The Unlicense](LICENSE) — public domain, matching the original Firefox add-on.
