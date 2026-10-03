# Tekphreak Thread Styler (Chrome port)

Chrome MV3 port of the Firefox add-on at
https://addons.mozilla.org/en-US/firefox/addon/tekphreak-thread-styler/.
Adds a floating toolbar to the Threads (threads.net / threads.com) composer
that restyles selected text using real Unicode characters (Mathematical
Alphanumeric Symbols + IPA small caps) instead of HTML/CSS, so styled text
renders natively in the feed. No network access, no background worker, no
permissions beyond the two host matches.

## Files
- `manifest.json` — MV3, content script only, scoped to threads.net/threads.com.
- `content.js` — style tables (monospace, italic, bold italic, sans bold,
  bold, fullwidth, small caps) built from Unicode codepoint offsets, a reverse map for
  "Normal" (strip styling), selection-triggered floating toolbar, and
  `execCommand('insertText', …)` to write the styled text back into the
  composer (fires the input events Threads' React/Lexical editor needs).
- `styles.css` — toolbar styling.
- `icons/` — generated via ImageMagick from a gradient "T" SVG (see git
  history / conversation for regeneration command if needed).

## Known Threads quirks
- Threads' composer has its own native "Mark as spoiler" selection popup.
  It attaches `mouseup`/`keyup` handlers directly on the composer and calls
  `stopPropagation()`, which will swallow bubble-phase listeners on
  `document` before they ever run. **Our selection listeners must stay on
  the capture phase** (`addEventListener(type, fn, true)`) — this is what
  makes our toolbar win the race. If the toolbar silently stops appearing
  again, this is the first thing to check.
- The extension only activates inside `isContentEditable` elements (i.e.
  the compose/reply box you're typing in) — it intentionally does not
  activate on read-only post captions you're just viewing. That's by
  design, matching the original Firefox add-on's scope.

## Testing
No test suite. Validate changes with:
```
node --check content.js
python3 -c "import json; json.load(open('manifest.json'))"
```
Then reload unpacked at `chrome://extensions` and manually test on a
Threads reply/composer box — type text, select it, confirm the toolbar
appears and each of the eight style buttons works, including "Normal" to
revert styled text back to plain ASCII. Toolbar labels are rendered in the
style each button produces. Also check the `ⓘ disclaimer` button: it acts on
the *whole* composer (not just the selection) — it prepends "ⓘ " (U+24D8 +
space) and restyles the rest of the text as Mathematical Sans-Serif Italic
(U+1D608…), undoing any earlier styling first. It does nothing if the text
already starts with that prefix. Same behavior as the web app at
tekphreak.com/apps/threadstyler/.
