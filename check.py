#!/usr/bin/env python3
"""발표 페이지 검사 (CI의 deck-check 단계)

out/index.html 을 크롬으로 열어 모든 장·클릭 단계를 넘기며 확인한다.
(?static 으로 열어 움직임 없이 각 단계의 끝 상태만 본다)
  - 화면(1920×1080) 밖으로 나간 요소
  - 코드·로그 카드 안에서 잘린 줄
  - 24px보다 작은 글자 (뒤 배경 파이프라인 그림은 카메라 배율까지 곱한 실제 크기)
  - 슬라이드 글자 속 물음표(질문형 문구 금지)와 이모지
  - 자바스크립트 오류
하나라도 걸리면 종료 코드 1 → PR에 빨간 X.

  python3 check.py               # 검사만
  python3 check.py --shots _shots  # 단계마다 화면도 저장
"""
import os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = 'file://' + os.path.join(ROOT, 'out', 'index.html') + '?static'
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
if shots:
    os.makedirs(shots, exist_ok=True)

PROBE = r"""
() => {
  const st = document.getElementById('stage'), page = document.querySelector('.page.active');
  const sr = st.getBoundingClientRect(), k = sr.width / 1920, out = [];
  const shown = el => { for (let e = el; e && e !== st; e = e.parentElement) { const c = getComputedStyle(e);
      if (c.opacity === '0' || c.visibility === 'hidden' || c.display === 'none') return false; } return true; };
  page.querySelectorAll('pre.code, pre.log').forEach(pre => {
    if (!shown(pre)) return;
    if (pre.scrollWidth > pre.clientWidth + 2) out.push('코드 줄이 카드 밖으로 넘침: ' + (pre.dataset.label || ''));
    if (pre.scrollHeight > pre.clientHeight + 2) out.push('코드 카드 아래가 잘림: ' + (pre.dataset.label || ''));
  });
  page.querySelectorAll('*').forEach(el => {
    if (el.closest('.notes') || el.closest('svg') || !shown(el)) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const x = (r.left - sr.left) / k, y = (r.top - sr.top) / k, x2 = (r.right - sr.left) / k, y2 = (r.bottom - sr.top) / k;
    if (x < -1 || y < -1 || x2 > 1921 || y2 > 1081) out.push('화면 밖: ' + (el.textContent || el.className).trim().slice(0, 24));
    if (!el.children.length && el.textContent.trim()) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 23.5) out.push(`글자가 너무 작음(${fs}px): ` + el.textContent.trim().slice(0, 24));
    }
  });
  const w = document.getElementById('world');
  if (w && w.classList.contains('on')) {
    const ws = new DOMMatrix(getComputedStyle(w).transform).a;
    w.querySelectorAll('*').forEach(el => {
      if (el.closest('svg') || !shown(el) || el.children.length || !el.textContent.trim()) return;
      const fs = parseFloat(getComputedStyle(el).fontSize) * ws;
      if (fs < 23.5) out.push(`배경 그림 글자가 너무 작음(${fs.toFixed(1)}px): ` + el.textContent.trim().slice(0, 24));
    });
  }
  const text = [...page.querySelectorAll('h1,h2,p,li,td,th,b,span,div')]
    .filter(e => !e.closest('.notes') && !e.closest('pre') && !e.children.length)
    .map(e => e.textContent).join('\n');
  if (/[?？]/.test(text)) out.push('슬라이드 글자에 물음표: 질문형 대신 명사형으로');
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text.replace(/[✓✗✕]/g, ''))) out.push('이모지 사용');
  const idx = [...document.querySelectorAll('.page')].indexOf(page) + 1;
  return {idx, title: page.dataset.title || '', step: +page.dataset.step, probs: out};
}
"""

def main():
    errors, problems, seen = [], [], set()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page(viewport={'width': 1920, 'height': 1080})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.goto(PAGE + '#p1-0')
        pg.wait_for_timeout(1000)
        total = pg.evaluate("() => document.querySelectorAll('.page').length")
        for _ in range(600):
            pg.wait_for_timeout(250)  # 정적 모드라 바로 끝 상태
            info = pg.evaluate(PROBE)
            key = (info['idx'], info['step'])
            if key in seen:
                break
            seen.add(key)
            if shots:
                pg.screenshot(path=os.path.join(shots, f"p{info['idx']:02d}-s{info['step']}.png"))
            for q in info['probs']:
                problems.append(f"{info['idx']}장 [{info['title']}] 단계 {info['step']}: {q}")
            pg.keyboard.press('ArrowRight')
        browser.close()
    print(f'{total}장, 화면 상태 {len(seen)}개 확인')
    for e in errors:
        print('스크립트 오류:', e)
    for q in dict.fromkeys(problems):
        print('문제:', q)
    if errors or problems:
        sys.exit(1)
    print('통과')

if __name__ == '__main__':
    main()
