/* 장별 기계 장면 (데이터): 어느 장에서 기계가 무엇을 하는지 여기서만 정함
 *   SC[장 id] = { base: 장에 들어올 때 상태, enter: 들어온 뒤 재생할 프레임들, steps: {클릭 번호: 프레임들} }
 *   프레임 = 상태에 덧붙일 부분 + t(앞 프레임 뒤 기다릴 ms) + fx(효과)
 *   장면 조각(gate, ciRun, cdPack ...)은 자주 쓰는 프레임 묶음을 만들어 주는 함수
 */
(function(D){
  'use strict';
  var M = D.WS.M, merge = D.WS.merge, NONE = D.WS.NONE, ALLOK = D.WS.ALLOK, BASE = D.WS.BASE;

  /* ---------- 장면 조각 ---------- */
  var OUT = {install:{t:'added 47 packages'}, lint:{t:'문제 없음', ko:1}, test:{t:'Tests 6 passed (6)'}, build:{t:'✓ built in 674ms'}};
  // 검사대 하나 통과: 카트가 다가감 → 실행 중 → 결과 (fast: 1 빠르게, 2 아주 빠르게)
  function gate(n, res, o){
    o = o || {};
    var a = {}, b = {}; a[n] = 'run'; b[n] = res || 'ok';
    var fr = [{t: o.t == null ? 120 : o.t, cap:{x:n}}, {t: o.fast === 2 ? 300 : o.fast ? 430 : 720, g:a}, {t: o.fast === 2 ? 140 : o.fast ? 260 : 480, g:b}];
    if(o.out !== false) fr[2].out = {at:n, t:OUT[n].t, ko:OUT[n].ko, st:'ok'};
    return fr;
  }
  function zgate(n){ var f = gate(n, 'ok', {t:0}); f[0].cam = n+'Z'; f[1].t += 300; return f; }  // 검사대로 다가가며 실행
  function ciRun(o){ return gate('install','ok',{fast:o.fast, t:o.t, out:o.out}).concat(gate('lint','ok',{fast:o.fast, out:o.out}), gate('test','ok',{fast:o.fast, out:o.out}), gate('build','ok',{fast:o.fast, out:o.out})); }
  function cdPack(o){ o = o || {};
    return [{t:120, cap:{x:'image'}, out:null}, {t:o.fast===2?300:o.fast?430:720, g:{image:'run'}},
            {t:o.fast===2?260:o.fast?520:1000, g:{image:'ok'}, cap:{kind:'cube', v:'v2'}, out: o.out===false ? null : {at:'image', t:'app:3f9a2c1'}}]; }
  function cdStore(o){ o = o || {};
    return [{t:o.fast?120:500, cap:{x:'reg'}, out:null}, {t:o.fast===2?300:o.fast?430:720, g:{reg:'run'}}, {t:o.fast===2?140:o.fast?260:480, g:{reg:'ok'}, stack:['v1','v2']}]; }
  function cdStage(o){ o = o || {};
    return [{t:120, cap:{x:'stg'}}, {t:o.fast===2?300:o.fast?430:720, g:{stg:'run'}},
            {t:o.fast===2?140:o.fast?260:600, g:{stg:'ok'}, out: o.out===false ? null : {at:'stg', t:'GET /health 200', st:'ok'}}]; }
  function cdShip(v, o){ o = o || {};
    var fr = [{t: o.t == null ? 300 : o.t, cap:{x:'door'}, out:null}, {t: o.fast ? 450 : 800, cap:{show:0}, prod:{v:v}}];
    if(o.out !== false) fr.push({t:700, out:{at:'prod', t:v+' 운영 반영', ko:1, st:'ok'}});
    return fr;
  }

  /* ---------- 여러 장이 함께 쓰는 상태 ---------- */
  var ONCI = {on:1, cam:'ci', show:{rail:'f', image:0, reg:0, stg:0, prod:0}};
  var MERGED = M({on:1, cam:'cd', show:{}, g:{install:'ok', lint:'ok', test:'ok', build:'ok', merge:'open'}, cap:{x:'after', t:'3f9a2c1', show:1}});
  var ONRAIL = M(MERGED, {cap:{x:'rail'}});
  var PACKED = M(ONRAIL, {g:{image:'ok'}, cap:{x:'image', kind:'cube', v:'v2'}, out:{at:'image', t:'app:3f9a2c1'}});
  var STORED = M(PACKED, {g:{reg:'ok'}, cap:{x:'reg'}, out:null, stack:['v1','v2']});
  var STAGED = M(STORED, {g:{stg:'ok'}, cap:{x:'stg'}, out:{at:'stg', t:'GET /health 200', st:'ok'}});
  var SHIPPED = {on:1, cam:'cd', show:{appr:1}, appr:'none', g:ALLOK, stack:['v1','v2'], prod:{v:'v2'},
                 cap:{x:'door', t:'3f9a2c1', kind:'cube', v:'v2', show:0}};
  var FADE_CD = {rail:'f', image:'f', reg:'f', stg:'f', appr:'f', prod:'f', brCD:'f'};
  var FADE_CI = {dev:'f', tube:'f', install:'f', lint:'f', test:'f', build:'f', merge:'f', brCI:'f'};
  var SHOW_CD = {rail:1, image:1, reg:1, stg:1, appr:1, prod:1, brCD:1};

  /* ---------- 장별 장면 ---------- */
  var SC = {
    cover:{ base:{on:1, cam:'cover', loop:1, show:{brCI:1, brCD:1}, stack:['v1','v2'], prod:{v:'v2'}} },

    auto:{
      base:{on:1, cam:'all', show:{tube:0, rail:0, install:0, lint:0, test:0, build:0, merge:0, image:0, reg:0, stg:0}, cap:{x:'dev', t:'커밋', show:0}},
      enter:[{t:500, show:{tube:1}}, {t:200, show:{install:1}}, {t:180, show:{lint:1}}, {t:180, show:{test:1}}, {t:180, show:{build:1}},
             {t:180, show:{merge:1}}, {t:220, show:{rail:1}}, {t:180, show:{image:1}}, {t:180, show:{reg:1}}, {t:180, show:{stg:1}},
             {t:700, cam:'ci'}, {t:900, cap:{show:1}}]
        .concat(ciRun({out:false, t:300}), [{t:300, cap:{x:'merge'}}, {t:700, g:{merge:'open'}}, {t:500, cam:'cd', cap:{x:'after'}}],
                cdPack({out:false}), cdStore(), cdStage({out:false}), cdShip('v2', {t:400, out:false}), [{t:1200, cam:'all'}]),
      steps:{1:[{show:{brCI:1, rail:'f', image:'f', reg:'f', stg:'f', prod:'f'}}],
             2:[{show:M({brCD:1, rail:1, image:1, reg:1, stg:1, prod:1}, FADE_CI)}]}
    },

    push:{ base:M(ONCI, {cap:{x:'dev', t:'e41b7d2', show:1}}),
      steps:{1:[{cap:{x:'entry'}}, {t:800, out:{at:'entry', t:'검사 시작', ko:1}}]} },

    gates:{ base:M(ONCI, {cap:{x:'entry', t:'e41b7d2', show:1}, out:{at:'entry', t:'검사 시작', ko:1}}),
      steps:{1:zgate('install'), 2:zgate('lint'), 3:zgate('test'),
             4:zgate('build').concat([{t:600, cap:{x:'merge'}, g:{merge:'open'}}])} },

    runner:{ base:M(ONCI, {g:{install:'ok', lint:'ok', test:'ok', build:'ok', merge:'open'}, cap:{x:'merge', t:'e41b7d2', show:1}}),
      steps:{1:[{show:{runner:1}}]} },

    fail:{ base:M(ONCI, {cap:{x:'dev', t:'7d3f0b8', show:1}}),
      steps:{1:[{cap:{x:'entry'}, spd:'fast'}].concat(gate('install','ok',{t:150, fast:1}), gate('lint','ok',{fast:1}), [
                {t:120, cap:{x:'test'}, spd:''}, {t:720, g:{test:'run'}},
                {t:800, g:{test:'ng'}, cap:{st:'ng'}, out:{at:'test', t:'Tests 3 failed | 3 passed (6)', st:'ng'}, fx:'shake', cam:'testZ'},
                {t:600, g:{build:'skip'}}]),
             2:[{cam:'failMergeZ', out:null}, {t:700, g:{merge:'lock'}}]} },

    fixed:{ base:M(ONCI, {g:{merge:'lock'}, cap:{x:'dev', t:'3f9a2c1', show:1}}),
      steps:{1:[{cap:{x:'entry'}, spd:'fast'}].concat(ciRun({fast:1, t:450}), [{t:400, cap:{x:'merge'}, g:{merge:'open'}, out:null, spd:''}]),
             2:[{cam:'mergeZ', out:null}, {t:600, cap:{x:'after'}, out:{at:'merge', t:'main에 합쳐짐', ko:1, st:'ok'}}]} },

    env:{ base:MERGED, enter:[{t:900, cap:{x:'rail'}}], steps:{1:[{show:{image:'f', reg:'f'}}]} },
    pack:{ base:ONRAIL, steps:{1:[{cam:'imageZ'}].concat(cdPack())} },
    store:{ base:PACKED, steps:{1:[{cam:'regZ'}].concat(cdStore()), 2:[{hi:'v1'}]} },
    staging:{ base:STORED, steps:{1:[{cam:'stgZ'}].concat(cdStage())} },
    delivery:{ base:M(STAGED, {show:{appr:1}, appr:'human', cam:'apprZ'}),
      enter:[{t:500, cap:{x:'pre'}, out:{at:'appr', t:'승인 대기', ko:1}}],
      steps:{1:[{appr:'up', out:null}, {t:650, cam:'shipZ'}].concat(cdShip('v2', {t:250}))} },
    deploy:{ base:M(STAGED, {show:{appr:1}, appr:'none', out:null, cam:'shipZ'}), enter:[{t:700, ghost:1}],
      steps:{1:cdShip('v2', {t:0})} },

    full:{ base:{on:1, cam:'all', show:{brCI:1, brCD:1, appr:1}, appr:'none', cap:{x:'dev', t:'3f9a2c1', show:1}},
      steps:{1:[{cam:'ci', show:{brCI:0, brCD:0}}, {t:500, cap:{x:'entry'}, spd:'fast'}].concat(ciRun({fast:1, out:false, t:420}), [{t:300, cap:{x:'merge'}, g:{merge:'open'}}]),
             2:[{cam:'cd'}, {t:450, cap:{x:'after'}, spd:'fast'}].concat(cdPack({fast:1, out:false}), cdStore({fast:1}), cdStage({fast:1, out:false}), cdShip('v2', {fast:1, t:250}), [{t:1100, cam:'all', spd:'', out:null, show:{brCI:1, brCD:1}}])} },

    prodFail:{ base:M(SHIPPED, {cam:'prodZ'}),
      steps:{1:[{prod:{fail:3}, out:{at:'prod', t:'서버 12대 중 3대 오류', ko:1, st:'ng'}}]} },

    revert:{ base:M(SHIPPED, {cam:'regProdZ'}), enter:[{t:600, hi:'v1'}],
      steps:{1:[{hi:'v1'}, {t:700, cap:{x:'reg', t:'v1', kind:'cube', v:'v1', show:1}}, {t:500, cap:{x:'door'}, spd:'fast'},
                {t:600, cap:{show:0}, prod:{v:'v1'}}, {t:700, out:{at:'prod', t:'v1로 복귀', ko:1, st:'ok'}, spd:''}],
             2:[{cam:'all', out:null, hi:'', show:{brCI:1, brCD:1}}, {t:1200, cap:{x:'dev', t:'Revert PR', kind:'', v:'', show:1}}]} },

    twoq:{ base:M(SHIPPED, {cam:'allLow', show:{brCI:1, brCD:1}}),
      steps:{1:[{show:FADE_CD}], 2:[{show:M(SHOW_CD, FADE_CI)}]} },

    sweep:{ base:M(SHIPPED, {cam:'allLow', loop:1, show:{brCI:1, brCD:1}, g:NONE, cap:{x:'dev', show:0}}) }
  };

  D.scenes = {
    get: function(id){ return SC[id]; },
    // 장 id의 클릭 s번까지 반영된 상태 (뒤로 가기·건너뛰기·정적 모드에서 바로 그 상태로)
    stateAt: function(id, s){
      var sc = SC[id]; if(!sc) return null;
      var st = merge(BASE, sc.base || {});
      (sc.enter || []).forEach(function(f){ st = merge(st, f); });
      for(var k=1;k<=s;k++) ((sc.steps && sc.steps[k]) || []).forEach(function(f){ st = merge(st, f); });
      return st;
    },
    // 클릭 s번 장면이 다 재생되는 데 걸리는 ms (data-late 문구를 그 뒤에 띄울 때)
    stepDuration: function(id, s){
      var fr = (SC[id] && SC[id].steps && SC[id].steps[s]) || [];
      return fr.reduce(function(a, f){ return a + (f.t || 0); }, 0);
    }
  };
})(window.Deck);
