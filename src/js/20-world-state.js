/* 파이프라인 기계의 상태(state) 모양과 합치는 규칙 (DOM 없음, 순수 데이터)
 *   상태 한 개 = 기계 그림 한 장면. 장면 데이터(21-scenes.js)는 이 상태에 "바뀐 부분"만 덧붙여 나감
 *   on/dim       기계 보이기, 흐리게          cam   카메라 이름 (22-world.js의 CAM)
 *   show         부품별 보이기(1)·숨기기(0)·흐리게('f')
 *   g            검사대별 상태 ''|run|ok|ng|skip, 머지는 lock|open
 *   cap          카트: x(위치) t(이름표) kind(cube=이미지 상자) v(v1|v2) st(ng) show
 *   out          검사대 위 결과 칩 {at, t, st, ko}    stack  보관소에 쌓인 이미지
 *   prod         운영 {v, fail}    appr  승인대 human|up|none    hi  강조할 상자    ghost  '승인 버튼 없음' 점선
 */
(function(D){
  'use strict';
  var NONE = {install:'', lint:'', test:'', build:'', merge:'', image:'', reg:'', stg:''};
  var ALLOK = {install:'ok', lint:'ok', test:'ok', build:'ok', merge:'open', image:'ok', reg:'ok', stg:'ok'};
  var BASE = {on:0, dim:0, cam:'ci', loop:0, spd:'', show:{brCI:0, brCD:0, runner:0, appr:0}, g:NONE, appr:'none',
              cap:{x:'dev', t:'', v:'', st:'', kind:'', show:0}, out:null, stack:['v1'], hi:'', prod:{v:'v1', fail:0}};
  var REPLACE = {out:1, stack:1};  // 이 키는 덧붙이지 않고 통째로 바꿈

  // a에 b를 덧붙인 새 상태 (한 단계 깊이까지 합침, t·fx는 재생용이라 상태에 남기지 않음)
  function merge(a, b){
    var o = {}, k, q;
    for(k in a) o[k] = a[k];
    for(k in b){
      if(k==='t' || k==='fx') continue;
      var v = b[k];
      if(!REPLACE[k] && v && typeof v==='object' && !Array.isArray(v) && a[k] && typeof a[k]==='object'){
        var m = {}; for(q in a[k]) m[q] = a[k][q]; for(q in v) m[q] = v[q]; o[k] = m;
      } else o[k] = v;
    }
    return o;
  }
  function M(){ var s = {}; for(var i=0;i<arguments.length;i++) s = merge(s, arguments[i]); return s; }

  D.WS = {NONE: NONE, ALLOK: ALLOK, BASE: BASE, merge: merge, M: M};
})(window.Deck);
