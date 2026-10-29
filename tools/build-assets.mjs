// 발표 페이지에 넣을 외부 오픈소스 결과물을 미리 만들어 둠.
//   node tools/build-assets.mjs   (tools/ 에서 npm i 한 번 필요)
// 결과물(vendor/, assets/)은 커밋하므로 Vercel·CI 빌드(build.py)에는 Node가 필요 없음.
//
//   vendor/rough-notation.js  손그림 동그라미·밑줄 (무대 축소 보정 패치 포함)
//   vendor/number-flow.js     굴러가는 숫자 <number-flow>
//   vendor/drauu.js           발표 중 펜으로 그리기
//   vendor/magic-move.js/.css 코드가 토큰 단위로 미끄러지며 바뀌는 애니메이션(재생기)
//   assets/icons.svg          Primer Octicons + Tabler Icons 중 쓰는 것만 <symbol>로
//   assets/faces.svg          DiceBear Notionists 다섯 얼굴
//   assets/code.json          deck.src.html 코드 카드를 Shiki(github-light)로 미리 칠한 줄
//   assets/magic-move.json    39장 GitHub → Jenkins → GitLab 전환용 토큰
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as esbuild from 'esbuild';
import { createHighlighter } from 'shiki';
import { codeToKeyedTokens, syncTokenKeys } from '@shikijs/magic-move/core';
import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const NM = join(HERE, 'node_modules');
const require = createRequire(import.meta.url);
const VENDOR = join(ROOT, 'vendor'), ASSETS = join(ROOT, 'assets');
mkdirSync(VENDOR, { recursive: true }); mkdirSync(ASSETS, { recursive: true });
const log = (...a) => console.log(...a);

// ---------- 1. 라이브러리 묶기 ----------
async function bundle(name, contents) {
  const r = await esbuild.build({ stdin: { contents, resolveDir: HERE, loader: 'js' }, bundle: true, format: 'iife', minify: true, write: false, target: 'es2019', legalComments: 'inline' });
  writeFileSync(join(VENDOR, name), r.outputFiles[0].text);
  log('vendor/' + name, Math.round(r.outputFiles[0].text.length / 1024) + 'KB');
}
await bundle('number-flow.js', "import 'number-flow';");
await bundle('drauu.js', "import { createDrauu } from '@drauu/core'; window.Drauu = { createDrauu };");
await bundle('magic-move.js', "import { MagicMoveRenderer } from '@shikijs/magic-move/renderer'; window.MagicMove = { MagicMoveRenderer };");
writeFileSync(join(VENDOR, 'magic-move.css'), readFileSync(join(NM, '@shikijs/magic-move/dist/style.css'), 'utf8'));

// rough-notation: 위치를 화면 좌표 차이로 잡는데 무대가 scale(k)로 줄어 있어 어긋남.
// 손그림 SVG는 폭 100px로 붙으므로, 그 실제 폭/100 = k 로 나눠 무대 좌표로 바꿈.
let rn = readFileSync(join(NM, 'rough-notation/lib/rough-notation.iife.js'), 'utf8');
const before = 'svgRect(t,e){const s=t.getBoundingClientRect(),i=e;return{x:(i.x||i.left)-(s.x||s.left),y:(i.y||i.top)-(s.y||s.top),w:i.width,h:i.height}}';
if (!rn.includes(before)) throw new Error('rough-notation svgRect 모양이 달라짐: 패치 확인 필요');
rn = rn.replace(before, 'svgRect(t,e){const s=t.getBoundingClientRect(),i=e,k=s.width/100||1;return{x:((i.x||i.left)-(s.x||s.left))/k,y:((i.y||i.top)-(s.y||s.top))/k,w:i.width/k,h:i.height/k}}');
writeFileSync(join(VENDOR, 'rough-notation.js'), '/*! rough-notation 0.5.1 | MIT | github.com/rough-stuff/rough-notation (무대 축소 보정 패치) */\n' + rn);
log('vendor/rough-notation.js', Math.round(rn.length / 1024) + 'KB');

// ---------- 2. 아이콘 ----------
const OCT = ['check-circle-fill', 'x-circle-fill', 'skip', 'lock', 'unlock', 'git-merge', 'git-pull-request', 'dot-fill', 'circle', 'check', 'repo', 'play'];
// Tabler 선 굵기는 CSS(.ti stroke-width)로 정함
const TAB = ['file-code', 'gauge', 'hammer', 'brush', 'shield-check', 'building-warehouse', 'server', 'key', 'settings-automation', 'brand-vercel', 'rocket', 'cloud-upload', 'shield-lock', 'copy', 'calendar-event', 'users', 'git-pull-request', 'package', 'brand-windows', 'brand-apple', 'brand-ubuntu'];
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '').trim();
let sprite = '';
for (const n of OCT) sprite += `<symbol id="oc-${n}" viewBox="0 0 24 24" fill="currentColor">${inner(readFileSync(join(NM, `@primer/octicons/build/svg/${n}-24.svg`), 'utf8'))}</symbol>`;
for (const n of TAB) sprite += `<symbol id="ti-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${inner(readFileSync(join(NM, `@tabler/icons/icons/outline/${n}.svg`), 'utf8'))}</symbol>`;
writeFileSync(join(ASSETS, 'icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${sprite}</svg>`);
log('assets/icons.svg', OCT.length + TAB.length, 'icons');

// ---------- 3. 얼굴 ----------
const FACES = { a: 'Ara', b: 'Felix', c: 'Kai', d: 'Dami', e: 'Aneka' };
let faces = '';
for (const [id, seed] of Object.entries(FACES)) {
  const svg = createAvatar(notionists, { seed, gestureProbability: 0 }).toString();
  const vb = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 1744 1744'])[1];
  const body = inner(svg).replace(/<metadata[\s\S]*?<\/metadata>/, '')
    .replace(/id="([^"]+)"/g, `id="f${id}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#f${id}-$1)`); // 다섯 얼굴의 id가 겹치지 않게
  faces += `<symbol id="face-${id}" viewBox="${vb}">${body}</symbol>`;
}
writeFileSync(join(ASSETS, 'faces.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${faces}</svg>`);
log('assets/faces.svg', Math.round(faces.length / 1024) + 'KB');

// ---------- 4. 코드 카드 색칠 (Shiki) ----------
const THEME = process.env.SHIKI_THEME || 'github-light';
const hl = await createHighlighter({ themes: [THEME], langs: ['yaml', 'javascript', 'groovy'] });
// 이 덱에서 초록=통과, 빨강=실패. github-light의 초록 키·빨강 키워드는 잉크색 굵게로 바꿔 의미가 섞이지 않게 함
// (문자열 남색, 숫자·상수 파랑, 함수 보라는 그대로). YAML에서 ':' 바로 앞 토큰은 키로 봄 (on: 이 상수 색으로 칠해지는 문제)
const BOLD = new Set(THEME === 'github-light' ? ['#22863A', '#D73A49'] : []);
const INK = '#1E1E1C';
function tone(list, lang) {
  return list.map((t, i) => {
    if (t.content === '\n' || !t.content.trim()) return t;
    // 키 = 바로 뒤가 ':'이고 그 ':' 뒤가 공백이나 줄 끝 (node:24 같은 값은 제외)
    const n1 = list[i + 1], n2 = list[i + 2];
    const colonEnd = n1 && n1.content.startsWith(':') && (n1.content.length > 1 ? /^:\s/.test(n1.content) : (!n2 || n2.content === '\n' || /^\s/.test(n2.content)));
    const yamlKey = lang === 'yaml' && colonEnd && !t.content.startsWith('-');
    const bold = (t.fontStyle & 2) || BOLD.has((t.color || '').toUpperCase()) || yamlKey;
    return { ...t, color: bold ? INK : t.color, bold };
  });
}
const LANG = { yaml: 'yaml', js: 'javascript', groovy: 'groovy', diff: 'javascript' };
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const src = readFileSync(join(ROOT, 'deck.src.html'), 'utf8');
const code = {};
for (const m of src.matchAll(/<pre class="code[^"]*"([^>]*)>([\s\S]*?)<\/pre>/g)) {
  const lang = (m[1].match(/data-lang="([^"]+)"/) || [])[1];
  if (!LANG[lang]) continue;
  const lines = dec(m[2]).replace(/^\n+|\n+$/g, '').split('\n');
  const body = lang === 'diff' ? lines.map((l) => l.slice(1)) : lines;
  const toks = hl.codeToTokens(body.join('\n'), { lang: LANG[lang], theme: THEME }).tokens;
  code[fnv(lang + '\n' + lines.join('\n'))] = toks.map((line) => tone(line, LANG[lang]).map((t) => {
    const st = (t.color ? `color:${t.color};` : '') + (t.fontStyle & 1 ? 'font-style:italic;' : '') + (t.bold ? 'font-weight:700;' : '');
    return st ? `<span style="${st}">${esc(t.content)}</span>` : esc(t.content);
  }).join(''));
}
writeFileSync(join(ASSETS, 'code.json'), JSON.stringify(code));
log('assets/code.json', Object.keys(code).length, 'blocks');

// ---------- 5. 39장 코드 전환 (Magic Move) ----------
const tabs = [...src.matchAll(/<pre class="code tabp[^"]*" data-lang="(\w+)" data-tabp="(\d)"[^>]*>([\s\S]*?)<\/pre>/g)].map((m) => ({ lang: LANG[m[1]], text: dec(m[3]).replace(/^\n+|\n+$/g, '') }));
if (tabs.length === 3) {
  // 글자 단위(splitTokens)로 쪼개면 전환 중 글자가 흩날려 읽기 어려움 → 단어 단위로 쪼개서 맞춤 (npm, run, lint 같은 단어가 통째로 이동)
  const opts = { splitTokens: false, enhanceMatching: true };
  const words = (info) => {
    const out = [];
    for (const t of info.tokens) {
      if (t.content === '\n') { out.push(t); continue; }
      for (const w of t.content.match(/\s+|[A-Za-z0-9_$@.\-]+|[^\sA-Za-z0-9_$@.\-]/g) || []) out.push({ ...t, content: w });
    }
    return { ...info, tokens: out.map((t, i) => ({ ...t, key: `${info.hash}-${i}` })) };
  };
  let steps = tabs.map((t) => { const w = words(codeToKeyedTokens(hl, t.text, { lang: t.lang, theme: THEME })); return { ...w, tokens: tone(w.tokens, t.lang) }; });
  for (let i = 1; i < steps.length; i++) { const r = syncTokenKeys(steps[i - 1], steps[i], opts); steps[i - 1] = r.from; steps[i] = r.to; }
  // 코드 카드와 같은 강약(키·키워드 굵게), 쓰지 않는 필드는 덜어 냄
  steps = steps.map((st) => ({ ...st, tokens: st.tokens.map(({ explanation, offset, bold, ...t }) => ({ ...t, htmlStyle: { 'font-weight': bold ? '700' : '400' } })) })); // 이동한 토큰에 이전 굵기가 남지 않게 항상 지정
  writeFileSync(join(ASSETS, 'magic-move.json'), JSON.stringify(steps));
  log('assets/magic-move.json', Math.round(JSON.stringify(steps).length / 1024) + 'KB');
} else log('magic-move: 39장 탭 코드 3개를 찾지 못함', tabs.length);

// ---------- 6. 라이선스 고지 (발표 파일 안에도 주석으로 들어감) ----------
const LIC = [
  ['rough-notation', 'rough-notation/LICENSE'],
  ['number-flow', 'number-flow/LICENSE.md'],
  ['esm-env (number-flow가 사용)', 'esm-env/LICENSE'],
  ['@drauu/core', '@drauu/core/LICENSE'],
  ['@shikijs/magic-move', '@shikijs/magic-move/LICENSE'],
  ['shiki (코드 색칠, github-light 테마)', 'shiki/LICENSE'],
  ['@primer/octicons', '@primer/octicons/LICENSE'],
  ['@tabler/icons', '@tabler/icons/LICENSE'],
  ['DiceBear (Notionists 얼굴: 그림 CC0 1.0 by Zoish, 코드 MIT)', '@dicebear/notionists/LICENSE'],
];
let lic = '이 발표 페이지에 들어간 오픈소스와 라이선스\n\n';
for (const [name, p] of LIC) {
  let t; try { t = readFileSync(join(NM, p), 'utf8'); } catch { t = readFileSync(join(NM, p.replace(/LICENSE(\.md)?$/, 'LICENSE.md')), 'utf8'); }
  lic += `===== ${name} =====\n${t.trim()}\n\n`;
}
// perfect-freehand는 @drauu/core 배포본 안에 들어 있어 따로 고지함 (MIT 본문은 drauu 것과 같고 저작권자만 다름)
lic += '===== perfect-freehand (@drauu/core 안에 포함) =====\n' + readFileSync(join(NM, '@drauu/core/LICENSE'), 'utf8').trim()
  .replace(/Copyright \(c\)[^\n]*/, 'Copyright (c) 2021 Stephen Ruiz Ltd') + '\n';
writeFileSync(join(VENDOR, 'LICENSES.txt'), lic.replace(/\*\//g, '* /'));
log('vendor/LICENSES.txt', LIC.length + 1, 'notices');
