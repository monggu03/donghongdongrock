/* 코드·로그 카드 준비: <pre class="code|log">의 글자를 줄 단위로 나누고 색칠·강조 표시를 붙임
 *   색칠: Shiki로 미리 칠해 둔 줄(assets/code.json, tools/build-assets.mjs)을 쓰고,
 *         코드가 바뀌어 짝이 없으면 아래 간이 색칠로 대신함
 *   속성: data-lang(yaml|js|groovy|diff) data-hl data-ng data-ok data-st(줄 번호 목록) data-mk(줄:번호표) data-label data-gap
 */
(function(D){
  'use strict';
  var SHIKI = window.DHDL_CODE || {};

  function hlYaml(line, tx){
    var m = line.match(/^(\s*-?\s*)([A-Za-z0-9_\-\.\$]+:)(.*)$/);
    if(/^\s*#/.test(line)){ var c=document.createElement('span'); c.className='c'; c.textContent=line; tx.appendChild(c); return; }
    if(m){
      tx.appendChild(document.createTextNode(m[1]));
      var k=document.createElement('span'); k.className='k'; k.textContent=m[2]; tx.appendChild(k);
      var v=document.createElement('span'); v.className='v'; v.textContent=m[3]; tx.appendChild(v);
    } else {
      var mm = line.match(/^(\s*-\s*)(.*)$/);
      if(mm){ tx.appendChild(document.createTextNode(mm[1])); var v2=document.createElement('span'); v2.className='v'; v2.textContent=mm[2]; tx.appendChild(v2); }
      else tx.textContent = line;
    }
  }
  function hlJs(line, tx){
    var re = /(`[^`]*`|'[^']*'|\b(?:export|function|const|return|import|from|pipeline|stages|stage|steps|sh)\b)/g, last=0, m;
    while((m=re.exec(line))){
      if(m.index>last) tx.appendChild(document.createTextNode(line.slice(last,m.index)));
      var s=document.createElement('span'); s.className = /^[`']/.test(m[0]) ? 'v' : 'k'; s.textContent=m[0]; tx.appendChild(s);
      last = m.index+m[0].length;
    }
    if(last<line.length) tx.appendChild(document.createTextNode(line.slice(last)));
  }
  // build-assets.mjs와 같은 해시 (언어 + 줄 내용 → 키)
  function fnv(s){ var h = 0x811c9dc5; for(var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); }

  D.$$('pre.code, pre.log', D.stage).forEach(function(pre){
    var lang = pre.dataset.lang||'text';
    var lines = pre.textContent.replace(/^\n+|\n+$/g,'').split('\n');
    var sh = pre.classList.contains('code') ? SHIKI[fnv(lang+'\n'+lines.join('\n'))] : null;
    if(sh) pre.classList.add('shiki');
    var hl = D.parseList(pre.dataset.hl), ng = D.parseList(pre.dataset.ng), ok = D.parseList(pre.dataset.ok), st = D.parseList(pre.dataset.st);
    var gap = pre.dataset.gap ? +pre.dataset.gap : .12;
    var mk = {}; (pre.dataset.mk||'').split(',').forEach(function(p){ if(!p) return; var a=p.split(':'); mk[+a[0]]=a[1]; });
    pre.textContent = '';
    if(pre.dataset.label){ var lb=document.createElement('span'); lb.className='lab'; lb.textContent=pre.dataset.label; pre.appendChild(lb); }
    if(pre.dataset.hl) pre.classList.add('hasdim');
    lines.forEach(function(line, i){
      var n=i+1, row=document.createElement('div'); row.className='cl';
      var tx=document.createElement('span'); tx.className='tx';
      if(lang==='diff'){
        var c0=line.charAt(0);
        if(c0==='+') row.classList.add('add'); else if(c0==='-') row.classList.add('del'); else row.classList.add('ctx');
        if(sh) tx.innerHTML = sh[i]; else hlJs(line.slice(1), tx);
      } else if(sh) tx.innerHTML = sh[i];
      else if(lang==='yaml') hlYaml(line, tx);
      else if(lang==='js' || lang==='groovy') hlJs(line, tx);
      else tx.textContent = line;
      if(hl[n]) row.classList.add('hl');
      if(ng[n]) row.classList.add('ng');
      if(ok[n]) row.classList.add('ok');
      if(st[n]) row.classList.add('st');
      row.appendChild(tx);
      if(mk[n]){ var b=document.createElement('span'); b.className='mk'; b.textContent=mk[n]; row.appendChild(b); }
      if(pre.classList.contains('type')) row.style.animationDelay = (0.2 + i*gap)+'s';
      pre.appendChild(row);
    });
  });
})(window.Deck);
