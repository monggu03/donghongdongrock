/* 파이프라인 기계 그리기: 상태 하나를 그림에 입히는 apply + 프레임을 차례로 재생하는 play
 *   그림과 좌표는 world/build.mjs가 만든 world.svg, world.json (build.py가 넣어 줌)
 *   'render' 이벤트를 구독해 장·단계가 바뀔 때마다 그 장의 장면(21-scenes.js)을 재생하거나 바로 맞춤
 */
(function(D){
  'use strict';
  var $$ = D.$$, STATIC = D.env.static, merge = D.WS.merge, BASE = D.WS.BASE;
  var WD = /*WORLD_JSON*/{};
  var view = document.getElementById('wview'), world = document.getElementById('world'), cartEl = document.getElementById('wCart'), loopEl = document.getElementById('wLoop'),
      tagEl = document.getElementById('wTag'), outEl = document.getElementById('wOut'), verEl = document.getElementById('wVer'),
      apprB = document.getElementById('wApprB'), apprS = document.getElementById('wApprS'), mergeB = document.getElementById('wMergeB');
  var W = {}; $$('[data-w]', world).forEach(function(e){ (W[e.dataset.w] = W[e.dataset.w] || []).push(e); });
  var blades = $$('.blade-g', world);
  var shelfBox = {v1: world.querySelector('.shelf-v1'), v2: world.querySelector('.shelf-v2')};
  var CART = WD.cartAt || {}, ANCH = WD.anchors || {};
  var GATES = ['install','lint','test','build','merge','image','reg','stg'];
  var FAIL_CELLS = [2, 6, 9];

  /* ---------- 카메라: 영역(r)을 화면 상자(box)에 꽉 차게 ---------- */
  function fitCam(r, box){
    var s = Math.min(box[2]/(r.x1 - r.x0), box[3]/(r.y1 - r.y0));
    return {s:s, tx: box[0] + box[2]/2 - (r.x0 + r.x1)/2*s, ty: box[1] + box[3]/2 - (r.y0 + r.y1)/2*s};
  }
  function padR(r, top, bottom){ return {x0:r.x0, x1:r.x1, y0:r.y0 - top, y1:r.y1 + bottom}; }
  var CAM = {ci:{s:1, tx:0, ty:0}};

  /* ---------- 처음 한 번: 카메라 목록과 글자 덧붙임 자리 ---------- */
  if(WD.width){
    var RG = WD.regions;
    CAM = {
      ci: fitCam(padR(RG.ci, 24, 120), [40, 236, 1840, 594]),
      cd: fitCam(padR(RG.cd, 24, 120), [40, 236, 1840, 594]),
      all: fitCam(padR(RG.all, 120, 90), [80, 230, 1760, 560]),
      allLow: fitCam(padR(RG.all, 120, 90), [80, 452, 1760, 520]),
      cover: fitCam(padR(RG.all, 120, 90), [80, 556, 1760, 480]),
    };
    /* 가까이 찍기: 제목 아래부터 아래 글 위까지(BZ) 한 장면을 꽉 채움. 창 밖(VZ 바깥)은 흐리게 가림 */
    var BZ = [40, 196, 1840, 630], VZ = [186, 836];
    var Z = function(x0, y0, x1, y1){ var c = fitCam({x0:x0, y0:y0, x1:x1, y1:y1}, BZ); c.v = VZ; return c; };
    // CI 검사대 하나씩: 위 결과 칩부터 카트까지 (installZ, lintZ, testZ, buildZ)
    ['install','lint','test','build'].forEach(function(n){ var a = ANCH[n].top; CAM[n+'Z'] = Z(a[0] - 350, a[1] - 75, a[0] + 350, a[1] + 315); });
    CAM.mergeZ = Z(1250, 200, 1950, 560);    // 머지 문
    CAM.failMergeZ = Z(1000, 210, 1700, 580); // 테스트에서 멈춘 카트와 잠긴 머지 문
    CAM.imageZ = Z(1820, 250, 2480, 640);    // 포장 성형기
    CAM.regZ = Z(2120, 220, 2700, 600);      // 보관 선반
    CAM.stgZ = Z(2380, 250, 2960, 620);      // 스테이징
    CAM.apprZ = Z(2560, 380, 3240, 700);     // 승인 스토퍼와 버튼
    CAM.shipZ = Z(2600, 200, 3700, 700);     // 승인부터 운영까지
    CAM.prodZ = Z(3100, 170, 3720, 670);     // 운영 서버 랙
    CAM.regProdZ = Z(2230, 200, 3700, 700);  // 보관소부터 운영까지(되돌리기)
    world.style.width = WD.width+'px'; world.style.height = WD.height+'px';
    $$('.wl', world).forEach(function(e){ var a = ANCH[e.dataset.at]; if(!a) return; e.style.left = a.label[0]+'px'; e.style.top = (a.label[1] + 16)+'px'; });
    [['wbrCI', WD.brackets.ci], ['wbrCD', WD.brackets.cd]].forEach(function(p){
      var e = document.getElementById(p[0]), b = p[1], dx = b.b[0] - b.a[0], dy = b.b[1] - b.a[1];
      e.style.left = b.a[0]+'px'; e.style.top = (b.a[1] - 23)+'px'; e.style.width = Math.hypot(dx, dy)+'px';
      e.style.transform = 'rotate('+Math.atan2(dy, dx)+'rad)';
    });
    verEl.style.left = WD.ver[0]+'px'; verEl.style.top = (WD.ver[1] - 8)+'px';
    (function(){ var cs = world.querySelector('.console'), gh = document.getElementById('wGhost'); if(!cs || !gh) return; var bb = cs.getBBox();
      gh.style.left = (bb.x - 10)+'px'; gh.style.top = (bb.y - 10)+'px'; gh.style.width = (bb.width + 20)+'px'; gh.style.height = (bb.height + 20)+'px'; })();
    ['v1','v2'].forEach(function(v){ var e = document.getElementById('wcv'+v.slice(1)), q = WD.crates[v]; e.style.left = q[0]+'px'; e.style.top = (q[1] - 6)+'px'; });
    loopEl.style.setProperty('--l0x', WD.loop.from[0]+'px'); loopEl.style.setProperty('--l0y', WD.loop.from[1]+'px');
    loopEl.style.setProperty('--l1x', WD.loop.to[0]+'px'); loopEl.style.setProperty('--l1y', WD.loop.to[1]+'px');
    Object.keys(WD.loop.at).forEach(function(n){ (W[n]||[]).forEach(function(e){ if(e instanceof SVGElement){ e.setAttribute('data-ld', ''); e.style.setProperty('--ld', (WD.loop.at[n]*9).toFixed(2)+'s'); } }); });
  }

  function each(name, fn){ (W[name] || []).forEach(fn); }
  function posOf(name){ return CART[name] || CART.dev || [0, 0]; }

  /* ---------- 상태 하나를 그림에 입힘 (inst: 움직임 없이 바로) ---------- */
  var prevW = null, icNow = {}, czT = null;
  function apply(st, inst){
    if(STATIC) inst = true;
    if(inst){ world.classList.add('inst'); view.classList.add('inst'); }
    world.classList.toggle('on', !!st.on);
    world.classList.toggle('dim', !!st.dim);
    world.classList.toggle('loop', !!st.loop);
    world.classList.toggle('fast', st.spd === 'fast');
    world.classList.toggle('vfast', st.spd === 'vfast');
    var c = CAM[st.cam] || CAM.ci;
    world.style.transform = 'translate('+c.tx+'px,'+c.ty+'px) scale('+c.s+')';
    world.classList.toggle('cam-all', c.s < .7);
    // 가까이 찍기에서 빠져나올 때는 카메라가 물러난 뒤에 라벨을 다시 보임
    clearTimeout(czT);
    if(c.v || inst) world.classList.toggle('cam-z', !!c.v);
    else if(world.classList.contains('cam-z')) czT = setTimeout(function(){ world.classList.remove('cam-z'); }, 700);
    $$('.wl', world).forEach(function(e){ var x = c.tx + parseFloat(e.style.left || 0)*c.s; e.classList.toggle('offcam', x < 90 || x > 1830); });
    view.style.setProperty('--v0', (c.v ? c.v[0] : -80)+'px'); view.style.setProperty('--v1', (c.v ? c.v[1] : 1160)+'px');
    world.style.setProperty('--fs', Math.max(1, 1/c.s).toFixed(3));
    Object.keys(W).forEach(function(name){
      var v = st.show[name]; if(v === undefined) v = 1;
      each(name, function(e){ e.classList.toggle('off', !v); e.classList.toggle('fade', v === 'f'); });
    });
    GATES.forEach(function(n){
      var s = st.g[n] || '';
      each(n, function(e){ e.setAttribute('data-st', s); });
      var lab = world.querySelector('.wl[data-at="'+n+'"] .ic');
      var ic = n === 'merge' ? (s === 'lock' ? 'lock' : s === 'open' ? 'open' : 'lockidle') : (s || 'wait');
      if(lab && icNow[n] !== ic){ icNow[n] = ic; lab.innerHTML = D.ICON[ic]; }
    });
    mergeB.textContent = st.g.merge === 'lock' ? '머지 잠김' : '머지';
    var al = {human:['승인', '사람이 버튼'], up:['승인됨', '사람이 누름'], none:['승인 없음', '바로 통과']}[st.appr] || ['승인', ''];
    apprB.parentNode.classList.toggle('skipped', st.appr === 'none');
    each('appr', function(e){ e.setAttribute('data-st', st.appr); });
    document.getElementById('wGhost').classList.toggle('on', !!st.ghost && !!c.v); apprB.textContent = al[0]; apprS.textContent = al[1];
    each('prod', function(e){ e.setAttribute('data-v', st.prod.v); });
    verEl.textContent = st.prod.v; verEl.classList.toggle('v2', st.prod.v === 'v2');
    blades.forEach(function(b, i){ var k = FAIL_CELLS.indexOf(i); b.classList.toggle('ng', k >= 0 && k < (st.prod.fail||0)); });
    ['v1','v2'].forEach(function(v){ var e = shelfBox[v]; if(!e) return; e.classList.toggle('off', st.stack.indexOf(v) < 0); e.classList.toggle('hi', st.hi === v);
      var b = document.getElementById('wcv'+v.slice(1)); if(b) b.classList.toggle('on', st.stack.indexOf(v) >= 0 && c.s >= .7 && st.show.reg !== 0 && st.show.reg !== 'f'); });
    // 카트와 이름표
    var cp = st.cap, p = posOf(cp.x), pc = prevW && prevW.cap;
    var jump = !inst && (!pc || p[0] < posOf(pc.x)[0] - 1 || cp.t !== pc.t || (cp.show && !pc.show));
    if(jump){ cartEl.classList.add('notr'); tagEl.classList.add('notr'); }
    var tg = WD.cartTop || [0, -60], label = cp.kind === 'cube' ? cp.v : cp.t;
    cartEl.style.transform = 'translate('+p[0]+'px,'+p[1]+'px)';
    tagEl.style.transform = 'translate('+(p[0] + tg[0])+'px,'+(p[1] + tg[1])+'px)';
    tagEl.textContent = label;
    tagEl.classList.toggle('ng', cp.st === 'ng');
    var tagOut = false;  // 가까이 찍을 때 이름표가 창 가장자리에 걸리면 숨김
    if(c.v){ var ty0 = c.ty + (p[1] + tg[1])*c.s, ty1 = ty0 + tagEl.offsetHeight*c.s, tx0 = c.tx + (p[0] + tg[0])*c.s;
      tagOut = ty0 < c.v[0] + 36 || ty1 > c.v[1] - 36 || tx0 < 60 || tx0 > 1860; }
    tagEl.classList.toggle('gone', !cp.show || !label || tagOut);
    cartEl.classList.toggle('ng', cp.st === 'ng');
    cartEl.classList.toggle('cube', cp.kind === 'cube');
    cartEl.classList.toggle('old', cp.kind === 'cube' && cp.v === 'v1');
    cartEl.classList.toggle('gone', !cp.show);
    if(jump){
      void cartEl.getBoundingClientRect(); cartEl.classList.remove('notr'); tagEl.classList.remove('notr');
      if(cp.show){ cartEl.classList.remove('popin'); void cartEl.getBoundingClientRect(); cartEl.classList.add('popin'); }
    }
    // 검사대 위 결과 칩
    var o = st.out, po = prevW && prevW.out;
    if(o){
      var a = ANCH[o.at] ? ANCH[o.at].top : [0, 0], dx = o.at === 'merge' ? 130 : 0, dy = o.at === 'merge' ? 16 : 0;
      outEl.style.left = (a[0] + dx)+'px'; outEl.style.top = (a[1] + dy)+'px';
      outEl.textContent = o.t;
      outEl.className = (o.st||'') + (o.ko ? ' ko' : '');
      if(!inst && (!po || po.t !== o.t || po.at !== o.at)){ void outEl.offsetWidth; outEl.classList.add('pop'); }
    } else outEl.className = 'gone';
    if(inst){ void world.offsetWidth; world.classList.remove('inst'); view.classList.remove('inst'); }
    prevW = st;
  }

  /* ---------- 프레임을 차례로 재생 (새 재생이 시작되면 이전 재생은 멈춤) ---------- */
  var tok = 0;
  function play(frames, from){
    var my = ++tok, cur = from, i = 0;
    (function nx(){
      if(my !== tok || i >= frames.length) return;
      var f = frames[i++];
      setTimeout(function(){
        if(my !== tok) return;
        cur = merge(cur, f); apply(cur, false);
        if(f.fx === 'shake'){ cartEl.classList.remove('shk'); void cartEl.getBoundingClientRect(); cartEl.classList.add('shk'); }
        nx();
      }, f.t || 0);
    })();
  }

  /* ---------- 장·단계가 바뀔 때 ---------- */
  D.on('render', function(ctx){
    var sc = D.scenes.get(ctx.id), mode = ctx.mode;
    tok++;
    if(!sc){ if(prevW && prevW.on) apply(merge(prevW, {on:0}), false); return; }
    if(STATIC || mode === 'jump' || mode === 'back'){ apply(D.scenes.stateAt(ctx.id, ctx.S), true); return; }
    if(mode === 'step'){ play((sc.steps && sc.steps[ctx.S]) || [], D.scenes.stateAt(ctx.id, ctx.S - 1)); return; }
    var b = merge(BASE, sc.base || {});
    if(!(prevW && prevW.on)) apply(merge(b, {on:0}), true);
    apply(b, false);
    if(sc.enter && sc.enter.length) play(sc.enter, b);
  });
})(window.Deck);
