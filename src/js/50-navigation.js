/* 진행: 지금 장(P)과 클릭 단계(S)를 갖고, 바뀔 때마다 한 번의 렌더를 정해진 순서로 지휘
 *   1. emit('beforeRender')   남은 예약 취소, 장이 바뀌면 펜 자국 지움
 *   2. 단계별 보이기·숨기기   data-s(이 단계부터) data-u(이 단계 전까지) data-on data-shake data-late
 *   3. 장별 동작              40-slides.js에 등록된 것
 *   4. emit('render')         기계 장면, 손그림 강조
 *   5. 진행 표시              구역 이름, 진행 막대, 쪽 번호, 주소(#p장-단계)
 *   6. emit('afterRender')    발표자 창에 알림
 */
(function(D){
  'use strict';
  var $$ = D.$$, STATIC = D.env.static, pages = D.pages, stage = D.stage;
  var N = pages.length, P = 0, S = 0, lastP = -1;
  var pn = document.getElementById('pn'), secEl = document.getElementById('sec'), progEl = document.getElementById('prog');

  function nsteps(p){ return +(pages[p].dataset.steps || 0); }

  function render(mode){
    var changed = P !== lastP;
    pages.forEach(function(p, i){ p.classList.toggle('active', i === P); });
    var page = pages[P];
    page.dataset.step = S;
    var ctx = {page: page, id: page.id, P: P, S: S, mode: mode, changed: changed};
    D.emit('beforeRender', ctx);

    // 장에 들어올 때는 전환을 끈 채로 단계 상태를 맞춤 (뒤 단계 글자가 잠깐 비치지 않게)
    if(changed){ page.classList.add('notr'); $$('.drw', page).forEach(function(d){ d.classList.add('undrawn'); }); }
    $$('[data-s],[data-u]', page).forEach(function(n){
      var s0 = n.dataset.s !== undefined ? +n.dataset.s : 0, u = n.dataset.u !== undefined ? +n.dataset.u : 1e9;
      n.classList.toggle('hid', !(S >= s0 && S < u));
    });
    if(changed){ void page.offsetWidth; page.classList.remove('notr'); }
    $$('.drw', page).forEach(function(d){ d.classList.toggle('undrawn', !!d.closest('.hid')); });
    // data-late: 그 단계의 기계 장면이 끝난 뒤에 나타남 (결과 문구가 결과보다 먼저 뜨지 않게)
    $$('[data-late]', page).forEach(function(n){
      var late = !STATIC && mode === 'step' && +n.dataset.s === S;
      n.style.transitionDelay = late ? D.scenes.stepDuration(page.id, S) + 'ms' : '';
    });
    $$('[data-on]', page).forEach(function(n){ n.classList.toggle('on', S >= +n.dataset.on); });
    if(mode === 'step') $$('[data-shake="'+S+'"]', page).forEach(function(n){ n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); });

    D.runSlide(ctx);
    D.emit('render', ctx);

    secEl.textContent = page.dataset.sec || ''; secEl.style.opacity = page.dataset.sec ? '1' : '0';
    progEl.style.width = (N > 1 ? P/(N-1)*100 : 0)+'%';
    pn.textContent = (P+1)+' / '+N;
    try{ history.replaceState(null, '', '#p'+(P+1)+'-'+S); }catch(e){}
    lastP = P;
    D.emit('afterRender', ctx);
  }

  function next(){ if(S < nsteps(P)){ S++; render('step'); } else if(P < N-1){ P++; S = 0; render('page'); } }
  function prev(){ if(S > 0){ S--; render('back'); } else if(P > 0){ P--; S = nsteps(P); render('back'); } }
  function go(p, s){ P = Math.max(0, Math.min(N-1, p)); S = Math.max(0, Math.min(nsteps(P), s||0)); render('jump'); }
  // 39장 탭처럼 같은 장 안에서 단계를 바로 고를 때
  function setStep(s){ S = s; render('step'); }

  // 화면 크기에 맞춰 1920×1080 무대를 줄이거나 키움
  function fit(){ var k = Math.min(window.innerWidth/1920, window.innerHeight/1080); stage.style.transform = 'translate(-50%,-50%) scale('+k+')'; }
  window.addEventListener('resize', fit);

  D.nav = {
    render: render, next: next, prev: prev, go: go, setStep: setStep, fit: fit, nsteps: nsteps, count: N,
    current: function(){ return {P: P, S: S, page: pages[P]}; }
  };
})(window.Deck);
