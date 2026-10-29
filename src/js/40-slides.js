/* 장별 동작: 장 id마다 "클릭 단계가 바뀔 때 할 일"을 등록 (Deck.onSlide)
 *   fn(step, page, mode)   mode = page(장에 들어옴) | step(다음 클릭) | back(뒤로) | jump(건너뜀)
 *   기계 장면은 21-scenes.js, 보이기·숨기기(data-s, data-u)는 50-navigation.js가 맡으니 여기는 그 밖의 것만
 */
(function(D){
  'use strict';
  var $$ = D.$$, STATIC = D.env.static, N = D.numbers;

  /* ---------- 32·33장 카나리 격자: 100명 중 n명을 정해진 무작위 순서로 칠함 ---------- */
  var ORDER = (function(){ var a = [], i, seed = 11; for(i=0;i<100;i++) a.push(i);
    function rnd(){ seed = (seed*16807) % 2147483647; return seed/2147483647; }
    for(i=99;i>0;i--){ var j = Math.floor(rnd()*(i+1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; })();
  ['g100a','g100b'].forEach(function(id){ var g = document.getElementById(id); for(var i=0;i<100;i++) g.appendChild(document.createElement('i')); });
  function setGrid(id, n){
    var ch = document.getElementById(id).children;
    for(var i=0;i<100;i++) ch[i].classList.remove('b');
    for(var k=0;k<n;k++){ var e = ch[ORDER[k]]; e.style.transitionDelay = (STATIC ? 0 : Math.min(k,40)*14)+'ms'; e.classList.add('b'); }
  }
  function people(n){ return n === 0 ? '전원 이전 버전' : n === 100 ? '전원 새 버전' : '새 버전 '+n+'명, 이전 버전 '+(100-n)+'명'; }

  // 3장: 발표 주간 타임라인, 지금 칸 강조 (1·2번째는 빨간 칸)
  D.onSlide('night', function(s, page){ $$('.tc', page).forEach(function(c, i){ c.className = 'tc' + (s >= 4 || i < s ? ' past' : i === s ? (i === 1 || i === 2 ? ' hot' : ' now') : ''); }); });

  // 8장: 점이 main에 닿는 순간마다 1씩 (시각은 실제 재생에서 잰 값)
  D.onSlide('five', function(s, page, mode){ N.seq('nf6', s >= 2 ? 6 : 0, s === 2 && mode === 'step' ? [1600,2060,2560,3020,3470,4180].map(function(t, i){ return [t, i+1]; }) : null); });

  // 10장: 6건 × 5가지가 5씩 쌓여 30
  D.onSlide('thirty', function(s, page, mode){ N.seq('nf30', 30, s === 1 && mode === 'step' ? [5,10,15,20,25,30].map(function(v, i){ return [350 + i*170, v]; }) : null); });

  // 25장: 승인 버튼
  D.onSlide('delivery', function(s){ var b = document.getElementById('approveBtn'); b.classList.toggle('done', s >= 1); b.textContent = s >= 1 ? '승인됨' : '승인하고 배포'; });

  // 28장: ci.yml 줄 강조 (data-hlsteps="1-4|8|9-14|15-17")와 오른쪽 설명
  D.onSlide('yaml', function(s, page){
    var pre = page.querySelector('pre[data-hlsteps]'), set = D.parseList(pre.dataset.hlsteps.split('|')[s] || '');
    $$('.cl', pre).forEach(function(r, i){ r.classList.toggle('hl', !!set[i+1]); });
    $$('.yl', page).forEach(function(y){ y.classList.toggle('on', +y.dataset.y === s); });
  });

  // 32·33장: 카나리
  D.onSlide('canary', function(s, page, mode){ var n = [0,5,25,50,100][s]; setGrid('g100a', n); N.pct('pctA', n, mode); document.getElementById('g100aL').textContent = people(n); });
  D.onSlide('rollback', function(s, page, mode){ var n = s >= 2 ? 0 : 25; setGrid('g100b', n); N.pct('pctB', n, mode); document.getElementById('g100bL').textContent = people(n); });

  // 35장: 지켜보는 숫자
  D.onSlide('monitor', function(){ N.monitor(); });

  // 39장: 도구 탭과 코드 전환
  D.onSlide('tools', function(s, page, mode){
    $$('.tab', page).forEach(function(t){ t.classList.toggle('on', +t.dataset.tab === s); });
    $$('.tabp', page).forEach(function(t){ t.classList.toggle('hid', +t.dataset.tabp !== s); });
    D.magicMove.show(s, page, mode);
  });

  // 42장: 체크리스트, 지금 말하는 줄 강조
  D.onSlide('day1', function(s, page){ $$('.checks li', page).forEach(function(li){ li.classList.toggle('ck', +li.dataset.c <= s); li.classList.toggle('now', +li.dataset.c === s); }); });

  // 44장: 응답 중인 리비전 다시 불러오기
  D.onSlide('self', function(){ D.live.load(0); });
})(window.Deck);
