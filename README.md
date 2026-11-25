# hritey.com

The HRITEY website: **Today's Bread** (ዕለታዊ እንጀራ). Three KJV verses a day (1 Old Testament leading into 2 New Testament), a 3-question quiz, and share buttons.

Plain HTML, CSS and a little vanilla JavaScript. No frameworks, no build step, no cookies, no tracking, no analytics, no sign-up. Hosted on GitHub Pages (`CNAME` = `hritey.com`).

## Files

```
index.html              the page
credits.html            icon, font and scripture credits
data/days.json          the daily verses + quiz (edit this to add days)
assets/css/style.css    styles
audio/                  one MP3 reading per day (made by tools/make_audio.py)
tools/make_audio.py     generates the audio for new days
assets/js/app.js        date line (Gregorian + Ethiopian), loads today's entry, quiz, share links
assets/img/             public-domain icons (web-sized .webp), og-v2.jpg share preview
assets/fonts/           Crimson Text + Noto Serif Ethiopic (subset), OFL license
favicon.png, apple-touch-icon.png
CNAME (hritey.com), .nojekyll
```

## Weekly theme

The site has **one theme per week, Sunday to Saturday** (separate from the social-media themes). Each day of the week brings 3 new verses that look at that theme from a different side. The theme shows small under the date as "This week: Hope" and is added to the share text.

The planned rotation lives in `data/days.json` under `"schedule"`, starting Sunday 22 November 2026:

1. Hope (22 Nov)
2. Peace (29 Nov)
3. Light in the Waiting (6 Dec)
4. Trust (13 Dec)
5. Gratitude (20 Dec)

The page picks the latest scheduled Sunday on or before the visitor's date, and only uses a scheduled theme once that week has daily entries. So after approval, Hope shows this week and Peace starts on its own on 29 November. Add the seven days for Light in the Waiting, Trust, and Gratitude before those Sundays, and those weeks will switch the same way, with no extra deploy step on the day.

Themes can also be named under `"weeks"`, keyed by the week's **Sunday** date (this overrides the schedule name if both are present):

```json
"weeks": {
  "2026-11-15": { "theme": "Joy" },
  "2026-11-22": { "theme": "Hope" }
}
```

To add a week: add it to `"schedule"` (and optionally `"weeks"`), then add its 7 days (below). Each day has a `side`: the day's angle on the theme, e.g. `"side": "We wait in hope"`. It shows small under "This week: …" and as "Tomorrow: …" on the quiz score screen the day before. It must say only what that day's three verses say. During fasts and feasts the week's theme can follow the Church calendar.

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

**Listen:** each day has a recorded reading in `audio/<date>.mp3` (the 3 verses with references, calm voice en-US-AndrewNeural, -10% rate, mono 48 kbps). It plays as a normal audio file, so it works on iPhone even with the silent switch on, and on Android. The button only shows when that day's file exists. **After adding days, run** `python3 tools/make_audio.py` (needs `pip install edge-tts` and ffmpeg). It creates audio only for days that don't have it yet (`--force` redoes all, or pass dates). Spoken text says "Lord" for LORD and "show" for shew; the verse shown on the page is never changed.

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

- Footer links: YouTube, TikTok and X (@hriteyofficial) are linked. Instagram and Facebook show as "coming soon" (`#` placeholders marked `data-soon` in `index.html`; search for `TODO`).
- Commentary is `null` for every day so far (verified Church Father quotes not added yet; the approved design has no commentary line).
