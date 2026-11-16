# hritey.com

The HRITEY website: **Today's Bread** (ዕለታዊ እንጀራ). Three KJV verses a day (1 Old Testament leading into 2 New Testament), a 3-question quiz, and share buttons.

Plain HTML, CSS and a little vanilla JavaScript. No frameworks, no build step, no cookies, no tracking, no analytics, no sign-up. Hosted on GitHub Pages (`CNAME` = `hritey.com`).

## Files

```
index.html              the page
credits.html            icon, font and scripture credits
data/days.json          the daily verses + quiz (edit this to add days)
assets/css/style.css    styles
assets/js/app.js        date line (Gregorian + Ethiopian), loads today's entry, quiz, share links
assets/img/             public-domain icons (web-sized .webp), og.jpg share preview
assets/fonts/           Crimson Text + Noto Serif Ethiopic (subset), OFL license
favicon.png, apple-touch-icon.png
CNAME, .nojekyll
```

## How to add a day

1. Open `data/days.json`.
2. Copy an existing day inside `"days"` and paste it with a new date key in `YYYY-MM-DD` format, e.g. `"2026-11-22"`. Keep the commas between entries correct (JSON has no trailing commas).
3. Fill in:
   - `theme`: a short internal label (not shown on the page).
   - `verses`: exactly 3, in order: 1 Old Testament verse, then 2 New Testament verses that quietly connect. `ref` like `"John 3:16"`, `text` copied **word for word from the KJV** (check it against a KJV source such as `https://bible-api.com/John%203:16?translation=kjv`). Write the divine name as `LORD` where the KJV prints it in small capitals.
   - `quiz`: 3 questions, one per verse. `verse` is the verse number in the list (0, 1, 2), `choices` are the options, and `answer` is the position of the right choice (0 = first, 1 = second, 2 = third). Mix up where the right answer sits.
   - `commentary`: leave `null`, or add a quote **only** from a Church Father before AD 451 that you have checked in a public-domain source:
     ```json
     "commentary": {
       "text": "the exact quote",
       "father": "St. Augustine",
       "work": "Tractates on the Gospel of John 46.3",
       "source_url": "https://www.newadvent.org/fathers/..."
     }
     ```
     It appears under the verses only when filled in. Never invent or paraphrase a quote.
4. Check the file is valid JSON (for example paste it into a JSON validator, or run `python3 -m json.tool data/days.json`).
5. Commit and push. GitHub Pages updates in a minute or two.

**Which day is shown:** the visitor's local date. If there is no entry for today, the page shows the latest entry before today (so the site never goes blank). Add days ahead of time.

## Preview locally

The page loads `data/days.json`, so open it through a small local server rather than double-clicking the file:

```
cd site
python3 -m http.server 8000
# then open http://localhost:8000
```

## Still to do

- Footer links: replace the three `#` placeholders in `index.html` (search for `TODO`) with the real YouTube, TikTok and Instagram URLs.
- Commentary is `null` for every day so far (verified Church Father quotes not added yet; the approved design has no commentary line).
