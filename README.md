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
CNAME (add back when hritey.com DNS is switched), .nojekyll
```

## Weekly theme

The site has **one theme per week, Sunday to Saturday** (separate from the X post themes). Each day of the week brings 3 new verses that look at that theme from a different side. The theme shows small under the date as "This week: Joy" and is added to the share text.

Themes live in `data/days.json` under `"weeks"`, keyed by the week's **Sunday** date:

```json
"weeks": {
  "2026-11-15": { "theme": "Joy" },
  "2026-11-22": { "theme": "Peace" }
}
```

A day uses the latest week that starts on or before it. To add a week: add its Sunday to `"weeks"`, then add its 7 days (below). Each day has a `side`: the day's angle on the theme, e.g. `"side": "Joy in trials"`. It shows small under "This week: …" and as "Tomorrow: …" on the quiz score screen the day before. It must say only what that day's three verses say. During fasts and feasts the week's theme can follow the Church calendar.

## How to add a day

1. Open `data/days.json`.
2. Copy an existing day inside `"days"` and paste it with a new date key in `YYYY-MM-DD` format, e.g. `"2026-11-22"`. Keep the commas between entries correct (JSON has no trailing commas).
3. Fill in:
   - `side`: the day's angle on the week's theme (shown on the page; see above).
   - `verses`: exactly 3, in order: 1 Old Testament verse, then 2 New Testament verses that quietly connect. `ref` like `"John 3:16"`, `text` copied **word for word from the KJV** (check it against a KJV source such as `https://bible-api.com/John%203:16?translation=kjv`). Write the divine name as `LORD` where the KJV prints it in small capitals.
   - `quiz`: 3 questions, one per verse. `verse` is the verse number in the list (0, 1, 2), `choices` are the options, and `answer` is the position of the right choice (0 = first, 1 = second, 2 = third). Mix up where the right answer sits (never 1st, 2nd, 3rd in order; question 3 not always last), keep choices about the same length, and word every question as `In <reference>, …?`.
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

**Quiz:** when a visitor taps Start, the verse wording blurs (and can't be selected or copied) so answers come from memory. It clears at the score screen, on "Leave quiz", or if they leave the page.

**Old-word help:** under each verse the page lists only the old words found in it, using the shared `"glossary"` at the top of `days.json` (e.g. `"thy": "your"`). Add a word there once and it works for every day. Verses ending in `:` or `;` (correct KJV) get a soft "…" mark from CSS; the text itself is unchanged.

**Listen:** a small button reads the three verses with the phone's own voice (browser speech). Hidden if the browser can't speak. Soft-launch test.

**Picture:** "Share as picture" (or "Save picture" where the browser can't share files) draws today's bread as an image in the HRITEY style, on the visitor's device.

**Which day is shown:** the visitor's local date. If there is no entry for today, the page shows the latest entry before today (so the site never goes blank) with a small "New verses coming soon" notice. Add days ahead of time.

## Preview locally

The page loads `data/days.json`, so open it through a small local server rather than double-clicking the file:

```
cd site
python3 -m http.server 8000
# then open http://localhost:8000
```

## Still to do

- Footer links: TikTok and Instagram (@hriteyofficial) are linked. YouTube and Facebook show as "coming soon" (`#` placeholders marked `data-soon` in `index.html`; search for `TODO`).
- Commentary is `null` for every day so far (verified Church Father quotes not added yet; the approved design has no commentary line).
