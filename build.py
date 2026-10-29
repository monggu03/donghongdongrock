#!/usr/bin/env python3
"""발표 페이지 빌드: src/ → out/index.html (폰트·캡처·배포 정보를 넣은 단일 파일)

  python3 build.py            # out/index.html  (Vercel이 배포하는 파일, 인터넷 없이도 열림)
  python3 build.py --artifact # out/deck.html 도 함께 (문서 뼈대 없는 버전)
  python3 build.py --src      # out/deck.src.html 도 함께 (조립만 한 원본, 비교·디버깅용)

환경 변수 (Vercel에서 자동/수동으로 들어옴, 없으면 비워 둠)
  DHDL_API_URL                   실습 백엔드(Cloud Run) 주소 → 슬라이드에 지금 리비전 표시
  VERCEL_GIT_COMMIT_SHA          이 화면을 만든 커밋 (Vercel이 자동으로 넣음)
  VERCEL_PROJECT_PRODUCTION_URL  운영 주소 → 마지막 장 QR (Vercel이 자동으로 넣음)

world/world.svg(기계 그림)와 world.json(좌표)을 넣는다. 그림을 고치면 node world/build.mjs 로 다시 만든다.
captures/<이름>.png|jpg 가 있으면 같은 이름의 캡처 자리를 그 이미지로 바꾼다.
fontTools가 있으면 쓰는 글자만 남겨 폰트를 줄이고, 없으면 자주 쓰는 한글 2,350자판을 넣는다.
"""
import base64, io, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(ROOT, 'fonts')
CAPS = os.path.join(ROOT, 'captures')
OUT = os.path.join(ROOT, 'out')
os.makedirs(OUT, exist_ok=True)

# ---------- 원본 조립 (src/ → 한 덩어리) ----------
# src/index.html 틀에 styles/*.css, slides/*.html, js/*.js를 파일 이름 순서대로 끼움 (앞 번호 = 순서)
SRC = os.path.join(ROOT, 'src')
def _read(path):
    return open(path, encoding='utf-8').read()
def _files(sub, ext):
    d = os.path.join(SRC, sub)
    return [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith(ext)]
def assemble():
    tpl = _read(os.path.join(SRC, 'index.html'))
    css = '\n'.join(_read(f).rstrip('\n') for f in _files('styles', '.css'))
    slides = '\n\n'.join(_read(f).rstrip('\n') for f in _files('slides', '.html'))
    js = '\n'.join('<script>\n' + _read(f).rstrip('\n') + '\n</script>' for f in _files('js', '.js'))
    for mark in ('<!--CSS-->', '<!--SLIDES-->', '<!--JS-->'):
        if tpl.count(mark) != 1:
            sys.exit(f'src/index.html에 {mark} 자리가 하나여야 함')
    return tpl.replace('<!--CSS-->', css).replace('<!--SLIDES-->', slides).replace('<!--JS-->', js)

src = assemble()
log = [f"src: 장 {len(_files('slides', '.html'))}개, 스타일 {len(_files('styles', '.css'))}개, 스크립트 {len(_files('js', '.js'))}개"]

# ---------- 배포 정보 ----------
api = os.environ.get('DHDL_API_URL', '').strip().rstrip('/')
sha = os.environ.get('VERCEL_GIT_COMMIT_SHA', '').strip()[:7]
prod = os.environ.get('VERCEL_PROJECT_PRODUCTION_URL', '').strip()
live = {'api': api, 'commit': sha}
if api:  # 발표장 와이파이가 안 될 때를 대비해 빌드 때 확인한 리비전을 넣어 둠 (실시간 값이 오면 덮어씀)
    try:
        import urllib.request
        with urllib.request.urlopen(api + '/api/hello', timeout=6) as r:
            d = json.loads(r.read().decode('utf-8'))
        if d.get('revision'):
            live['revision'] = str(d['revision']); live['message'] = str(d.get('message', ''))
    except Exception:
        pass
src = src.replace('/*LIVE*/{}', json.dumps(live, ensure_ascii=False))
log.append(f"live: api={'있음' if api else '없음'} commit={sha or '-'} revision={live.get('revision', '-')}")

# ---------- 파이프라인 기계 그림 (node world/build.mjs 로 다시 만듦) ----------
WORLD = os.path.join(ROOT, 'world')
src = (src.replace('<!--WORLD_SVG-->', open(os.path.join(WORLD, 'world.svg'), encoding='utf-8').read())
          .replace('/*ISO_CSS*/', open(os.path.join(WORLD, 'vendor', 'anatomy', 'iso.css'), encoding='utf-8').read())
          .replace('/*WORLD_JSON*/{}', open(os.path.join(WORLD, 'world.json'), encoding='utf-8').read()))
log.append(f"world: {os.path.getsize(os.path.join(WORLD, 'world.svg')) // 1024}KB")

# ---------- 캡처 ----------
def find_cap(name):
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        p = os.path.join(CAPS, f'{name}.{ext}')
        if os.path.exists(p):
            return p
    return None

def data_uri(path):
    ext = path.rsplit('.', 1)[1].lower()
    mime = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}[ext]
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()

def qr_uri():
    svg = os.path.join(CAPS, 'qr.svg')  # 미리 만들어 둔 QR이 있으면 그대로 (segno 없이도 동작)
    if os.path.exists(svg):
        log.append('QR: captures/qr.svg')
        return 'data:image/svg+xml;base64,' + base64.b64encode(open(svg, 'rb').read()).decode()
    qp = os.path.join(CAPS, 'qr.txt')
    url = open(qp, encoding='utf-8').read().strip() if os.path.exists(qp) else (f'https://{prod}' if prod else '')
    if not url:
        return None
    try:
        import segno
    except ImportError:
        log.append('QR: segno 없음, 자리 유지'); return None
    buf = io.BytesIO()
    segno.make(url, error='m').save(buf, kind='svg', scale=10, border=2, dark='#1E1E1C', light='#FFFFFF')
    log.append(f'QR: {url}')
    return 'data:image/svg+xml;base64,' + base64.b64encode(buf.getvalue()).decode()

used, missing = [], []
def slot_repl(m):
    name, attrs = m.group(1), m.group(2)
    style = re.search(r'style="([^"]*)"', attrs).group(1)
    ds = re.search(r'data-s="(\d+)"', attrs)
    extra = f' data-s="{ds.group(1)}"' if ds else ''
    uri = qr_uri() if name == 'qr' else (data_uri(find_cap(name)) if find_cap(name) else None)
    if not uri:
        missing.append(name); return m.group(0)
    used.append(name)
    return f'<div class="shot"{extra} style="{style}"><img src="{uri}" alt=""></div>'
src = re.sub(r'<div class="slot" data-cap="([\w-]+)"([^>]*)>.*?</div>', slot_repl, src)

def img_repl(m):
    p = find_cap(m.group(1))
    if not p:
        return ''
    used.append(m.group(1))
    return f'<img src="{data_uri(p)}" alt="" style="z-index:2;background:#fff">'
src = re.sub(r'<img data-cap-img="([\w-]+)" alt="">', img_repl, src)
log.append(f"captures: 넣음 {sorted(set(used)) or '-'} / 빈 자리 {sorted(set(missing)) or '-'}")

# ---------- 폰트 ----------
FACES = [  # (CSS 이름, 파일, 굵기 범위, 줄일지)
    ('Pretendard', 'PretendardVariable.woff2', '45 920', True),
    ('JetBrains Mono', 'JetBrainsMono-Regular.woff2', '400', True),
    ('JetBrains Mono', 'JetBrainsMono-Bold.woff2', '700', True),
    ('DHDL Serif', 'DHDLSerif-Subset.woff2', '900', False),
]
try:
    import fontTools.subset  # noqa: F401
    can_subset = True
except ImportError:
    can_subset = False
tmp = tempfile.mkdtemp()
chars = set(ch for ch in src if ord(ch) >= 0x80) | set(chr(c) for c in range(0x20, 0x7F)) | set('→✓✗✕·–—“”‘’…')
txt = os.path.join(tmp, 'chars.txt'); open(txt, 'w', encoding='utf-8').write(''.join(sorted(chars)))

css = []
for fam, fn, weight, shrink in FACES:
    path = os.path.join(FONTS, fn)
    if fam == 'Pretendard' and not can_subset:
        path = os.path.join(FONTS, 'PretendardVariable-KS.woff2')  # 자주 쓰는 한글 2,350자만 담은 판
    if shrink and can_subset:
        out = os.path.join(tmp, fn)
        subprocess.run([sys.executable, '-m', 'fontTools.subset', path, f'--text-file={txt}', '--flavor=woff2',
                        f'--output-file={out}', '--layout-features=*', '--no-hinting'], check=True, capture_output=True)
        path = out
    b64 = base64.b64encode(open(path, 'rb').read()).decode()
    css.append(f"@font-face{{font-family:'{fam}';src:url(data:font/woff2;base64,{b64}) format('woff2');"
               f"font-weight:{weight};font-style:normal;font-display:block}}")
src = src.replace('/*FONTS*/', '\n'.join(css))
log.append('fonts: ' + ('쓰는 글자만' if can_subset else '자주 쓰는 글자판 (fontTools 없음)'))

# ---------- 오픈소스 조각 (node tools/build-assets.mjs 로 다시 만들고 결과를 커밋해 둠) ----------
VEND, ASSETS = os.path.join(ROOT, 'vendor'), os.path.join(ROOT, 'assets')
def rd(*p):
    path = os.path.join(*p)
    return open(path, encoding='utf-8').read() if os.path.exists(path) else ''
def js_safe(s):  # <script> 안에 넣을 때 태그가 끊기지 않게
    return s.replace('</', '<\\/')
vjs = '/*!\n' + rd(VEND, 'LICENSES.txt') + '*/\n' + '\n'.join(rd(VEND, f) for f in ('rough-notation.js', 'number-flow.js', 'drauu.js', 'magic-move.js'))
src = (src.replace('/*VENDOR_CSS*/', rd(VEND, 'magic-move.css'))
          .replace('<!--ICONS-->', rd(ASSETS, 'icons.svg') + rd(ASSETS, 'faces.svg'))
          .replace('/*CODE_JSON*/{}', js_safe(rd(ASSETS, 'code.json') or '{}'))
          .replace('/*MM_JSON*/null', js_safe(rd(ASSETS, 'magic-move.json') or 'null'))
          .replace('/*VENDOR_JS*/', vjs))
log.append(f"vendor: {len(vjs) // 1024}KB, 코드 색칠 {len(json.loads(rd(ASSETS, 'code.json') or '{}'))}개")

# ---------- 출력 ----------
head_end = src.index('</style>') + len('</style>')
full = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + src[:head_end] + '\n</head>\n<body>\n' + src[head_end:] + '\n</body>\n</html>\n')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(full)
if '--src' in sys.argv:
    open(os.path.join(OUT, 'deck.src.html'), 'w', encoding='utf-8').write(assemble())
if '--artifact' in sys.argv:
    open(os.path.join(OUT, 'deck.html'), 'w', encoding='utf-8').write(src)
log.append('out: ' + ', '.join(f'{f} {os.path.getsize(os.path.join(OUT, f)) // 1024}KB' for f in sorted(os.listdir(OUT)) if f.endswith('.html')))
print('\n'.join(log))
