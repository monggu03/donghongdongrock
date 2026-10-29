/* 상태 아이콘과 차례 등장 준비
 *   Deck.ICON: 검사 상태별 아이콘(40×40 SVG 안쪽). 통과·실패·건너뜀·자물쇠는 GitHub 화면과 같은 Primer Octicons(assets/icons.svg)
 *   <svg data-ic="ok"> 처럼 쓰면 여기서 채움. 기계 라벨 아이콘은 22-world.js가 상태에 따라 바꿈
 *   .stg, .st8의 자식에는 --i(순서)를 매겨 차례로 떠오르게 함
 */
(function(D){
  'use strict';
  D.ICON = {
    wait:'<circle cx="20" cy="20" r="16" stroke="#C6C6BE" stroke-width="3" fill="#fff"/>',
    run:'<g class="spin"><circle cx="20" cy="20" r="16" stroke="#E6D3A8" stroke-width="4" fill="#fff"/><path d="M20 4a16 16 0 0 1 16 16" stroke="#BF8700" stroke-width="4" fill="none" stroke-linecap="round"/></g>',
    ok:'<circle cx="20" cy="20" r="15" fill="#fff"/><use href="#oc-check-circle-fill" x="1" y="1" width="38" height="38" style="color:#1A7F37"/>',
    ng:'<circle cx="20" cy="20" r="15" fill="#fff"/><use href="#oc-x-circle-fill" x="1" y="1" width="38" height="38" style="color:#CF222E"/>',
    skip:'<circle cx="20" cy="20" r="15" fill="#fff"/><use href="#oc-skip" x="2" y="2" width="36" height="36" style="color:#9A9A92"/>',
    lockidle:'<circle cx="20" cy="20" r="16" stroke="#C6C6BE" stroke-width="3" fill="#fff"/><use href="#oc-lock" x="11" y="11" width="18" height="18" style="color:#9A9A92"/>',
    lock:'<circle cx="20" cy="20" r="18" fill="#CF222E"/><use href="#oc-lock" x="9" y="8.5" width="22" height="22" style="color:#fff"/>',
    open:'<circle cx="20" cy="20" r="18" fill="#1A7F37"/><use href="#oc-unlock" x="9" y="8.5" width="22" height="22" style="color:#fff"/>'
  };
  D.$$('[data-ic]', D.stage).forEach(function(s){ s.innerHTML = D.ICON[s.dataset.ic] || ''; });
  D.$$('.stg, .st8', D.stage).forEach(function(g){ [].forEach.call(g.children, function(c,i){ c.style.setProperty('--i', i); }); });
})(window.Deck);
