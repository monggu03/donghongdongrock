/* 39장 코드 전환 (Shiki Magic Move, vendor/magic-move.js + assets/magic-move.json)
 *   GitHub Actions → Jenkins → GitLab CI 코드가 단어 단위로 미끄러지며 바뀌고, 번호 표시(트리거·러너·단계)도 줄을 따라 이동
 *   데이터나 라이브러리가 없거나 실패하면 원래의 탭별 코드 카드 세 장(pre.tabp)을 그대로 씀
 */
(function(D){
  'use strict';
  var STATIC = D.env.static;
  var MM = {steps: window.DHDL_MM, r: null, cur: -1};

  function show(s, page, mode){
    if(!MM.steps || !window.MagicMove || MM.failed) return;
    var card = document.getElementById('mmcard'), pres = D.$$('pre.tabp', page);
    try{
      var k = D.stage.getBoundingClientRect().width / 1920 || 1;  // 무대 축소 배율
      if(!MM.r){
        card.hidden = false; pres.forEach(function(p){ p.style.display = 'none'; });
        MM.r = new window.MagicMove.MagicMoveRenderer(document.getElementById('mmpre'), {duration: 900, containerStyle: false, globalScale: k, delayMove: .25, delayEnter: .65});
      }
      MM.r.options.globalScale = k;
      var animate = !STATIC && MM.cur >= 0 && MM.cur !== s && (mode === 'step' || mode === 'back');
      if(animate) MM.r.render(MM.steps[s]); else MM.r.replace(MM.steps[s]);
      MM.cur = s;
      var src = pres[s];
      document.getElementById('mmlab').textContent = src ? src.dataset.label : '';
      var mk = {}; ((src && src.dataset.mk) || '').split(',').forEach(function(p){ if(!p) return; var a = p.split(':'); mk[a[1]] = +a[0]; });
      // 번호 표시는 가리키는 줄의 글자 끝 바로 뒤에 붙고, 코드가 바뀌면 같이 이동
      var lh = 28 * 1.48, lines = (MM.steps[s].code || '').split('\n'), wrap = card.querySelector('.mmwrap');
      if(!MM.cw){ var sp = document.createElement('span'); sp.textContent = '0000000000'; sp.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
        wrap.appendChild(sp); MM.cw = sp.getBoundingClientRect().width / 10 / k; wrap.removeChild(sp); }
      D.$$('.mk.mm', card).forEach(function(m){
        var line = mk[m.dataset.m];
        m.style.opacity = line ? 1 : 0;
        if(line) m.style.transform = 'translate(' + (30 + (lines[line - 1] || '').length * MM.cw + 24) + 'px,' + ((line - 1) * lh + (lh - 40) / 2) + 'px)';
      });
    }catch(e){
      MM.failed = true; card.hidden = true; pres.forEach(function(p){ p.style.display = ''; });
    }
  }

  D.magicMove = {show: show};
})(window.Deck);
