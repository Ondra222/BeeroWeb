#!/usr/bin/env python3
"""Copy the screens from the Android app (Ondra222/Beero, app/src/main/assets) into this web app
and apply the web-only changes. Usage:

    python3 tools/sync_from_android.py ../Beero/BeeroAppMap9/BeeroApp/app/src/main/assets

android.js (the web replacement of the Kotlin bridge) is NOT generated - new bridge methods
in the Android app have to be added there by hand.
"""
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)

HEAD = """<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#11141B">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Beero">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
"""

PAGES = {  # android asset -> web file
    'beero3d.html': 'index.html',
    'map.html': 'map.html', 'pubs.html': 'pubs.html', 'awards.html': 'awards.html',
    'stats.html': 'stats.html', 'catalog.html': 'catalog.html', 'settings.html': 'settings.html',
    'welcome.html': 'welcome.html',
}
COPY = ['ui.js', 'ui.css', 'beers.json', 'beero.png']


def must_replace(s, old, new, name):
    if old not in s:
        sys.exit(f'{name}: cannot find {old!r} - update tools/sync_from_android.py')
    return s.replace(old, new, 1)


def page(src, name):
    s = open(src, encoding='utf-8').read()
    s = must_replace(s, '</title>\n', '</title>\n' + HEAD, name)
    s = must_replace(s, '<script src="ui.js"></script>', '<script src="android.js"></script>\n<script src="ui.js"></script>', name)
    # three.js is loaded from the CDN on the web (index.html falls back to it when the local file is missing)
    s = s.replace('<script src="three.min.js"></script>\n', '')
    s = s.replace('file:///android_res/drawable/splash_mascot.png', 'beero.png')
    if name == 'settings.html':
        mapy = open(os.path.join(HERE, 'settings-mapy.html'), encoding='utf-8').read()
        web = open(os.path.join(HERE, 'settings-web.html'), encoding='utf-8').read()
        s = must_replace(s, ' <h2>Your data</h2>', mapy + ' <h2>Your data</h2>', name)
        s = must_replace(s, '</body>', web + '</body>', name)
    if 'file:///' in s:
        sys.exit(f'{name}: still contains file:/// - add a web replacement')
    return s


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    a = sys.argv[1]
    for src, dst in PAGES.items():
        open(os.path.join(WEB, dst), 'w', encoding='utf-8').write(page(os.path.join(a, src), dst))
    for f in COPY:
        shutil.copyfile(os.path.join(a, f), os.path.join(WEB, f))
    bd = os.path.join(a, 'brands')
    for f in os.listdir(bd):
        shutil.copyfile(os.path.join(bd, f), os.path.join(WEB, 'brands', f))
    print('Synced. Now bump VERSION in sw.js.')


if __name__ == '__main__':
    main()
