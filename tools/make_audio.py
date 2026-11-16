#!/usr/bin/env python3
"""Make the Listen audio for HRITEY: one MP3 per day in data/days.json -> audio/<date>.mp3.

Reads each day's 3 verses with references ("Psalm 16, verse 11. ...") with a short pause
between verses. Spoken text only: LORD->Lord, shew->show, etc. (same as the site's speakable());
the verse text shown on the page is never changed.

Needs: edge-tts (pip install edge-tts) and ffmpeg.
Usage:  python3 tools/make_audio.py            # only days without audio yet
        python3 tools/make_audio.py --force    # regenerate everything
        python3 tools/make_audio.py 2026-11-22 # just these dates
"""
import json, os, re, subprocess, sys, tempfile, shutil, time

VOICE = os.environ.get('HRITEY_VOICE', 'en-US-AndrewNeural')
RATE = os.environ.get('HRITEY_RATE', '-10%')
PAUSE_SEC = 0.9
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE = shutil.which('edge-tts') or os.path.join(os.path.dirname(sys.executable), 'edge-tts')

SAY = [(r'\bLORD\b', 'Lord'), (r'\bGOD\b', 'God'), (r'\bJESUS\b', 'Jesus'),
       (r'\bshew\b', 'show'), (r'\bShew\b', 'Show'), (r'\bshewed\b', 'showed'), (r'\bsheweth\b', 'showeth')]


def speakable(t):
    for a, b in SAY:
        t = re.sub(a, b, t)
    return t


def spoken_ref(ref):
    return re.sub(r'(\d+):(\d+)', r'\1, verse \2', ref)


def run(cmd, tries=1):
    for n in range(tries):
        r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        if r.returncode == 0:
            return
        time.sleep(3 * (n + 1))
    raise RuntimeError('failed: ' + ' '.join(cmd[:3]) + '\n' + r.stderr[-800:])


def make_day(date, day, out):
    with tempfile.TemporaryDirectory() as tmp:
        silence = os.path.join(tmp, 'pause.wav')
        run(['ffmpeg', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=24000:cl=mono', '-t', str(PAUSE_SEC), silence])
        parts = []
        for i, v in enumerate(day['verses']):
            text = spoken_ref(v['ref']) + '. ' + speakable(v['text'])
            mp3 = os.path.join(tmp, f'v{i}.mp3')
            run([EDGE, '--voice', VOICE, f'--rate={RATE}', '--text', text, '--write-media', mp3], tries=6)
            wav = os.path.join(tmp, f'v{i}.wav')
            run(['ffmpeg', '-y', '-i', mp3, '-ar', '24000', '-ac', '1', wav])
            if parts:
                parts.append(silence)
            parts.append(wav)
        lst = os.path.join(tmp, 'list.txt')
        with open(lst, 'w') as f:
            f.writelines(f"file '{p}'\n" for p in parts)
        run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ac', '1', '-ar', '24000',
             '-codec:a', 'libmp3lame', '-b:a', '48k', '-id3v2_version', '3',
             '-metadata', f'title=HRITEY Today\'s Bread {date}', out])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    days = json.load(open(os.path.join(ROOT, 'data', 'days.json')))['days']
    os.makedirs(os.path.join(ROOT, 'audio'), exist_ok=True)
    for date in sorted(days):
        if args and date not in args:
            continue
        out = os.path.join(ROOT, 'audio', date + '.mp3')
        if os.path.exists(out) and not force and not args:
            continue
        make_day(date, days[date], out)
        print(date, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()
