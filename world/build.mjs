// 발표 뒤에 깔리는 파이프라인 기계 그림을 만든다.
//   node world/build.mjs          → world/world.svg, world/world.json
// 그리는 도구는 anatomy(MIT, github.com/wheresryan22/anatomy)의 iso-kit을 그대로 쓴다(vendor/anatomy).
// 기계: 작업대 위 레일을 따라 커밋 카트리지가 지나가는 조립 라인.
//   내 컴퓨터 → 설치(호퍼) → 린트(빗살) → 테스트(다이얼 게이지) → 빌드(프레스) → 머지(자물쇠 게이트)
//   → 포장(성형기) → 보관(선반) → 스테이징(작은 랙) → 승인(차단기) → 운영(서버 랙)
// 움직이는 부품은 한 번 그려 두고, 발표 페이지가 CSS 변환·data-st 로 상태만 바꾼다.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./vendor/anatomy/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const AZ = +(process.env.AZ || 80), EL = +(process.env.EL || 26);
const SCALE = 2.2;           // 화면 px / 월드 단위 (cameraOf의 k는 SCALE·√1.6)
const PAD = 60;

// ---------- 배치 (월드 단위, x는 라인 방향, y는 +가 보는 사람 쪽, z는 위) ----------
const BENCH_Y = -66, BENCH_D = 116;           // 작업대 앞뒤
const FRONT = BENCH_Y + BENCH_D;              // 50
const TOP = 0, SLAB = 14, FRAME = 6, FOOT = 5; // 상판 두께, 받침 틀, 발
const CI_BENCH = { x: 0, y: BENCH_Y, w: 622, d: BENCH_D, r: 10 };
const CD_BENCH = { x: 640, y: BENCH_Y, w: 650, d: BENCH_D, r: 10 };
const RAIL_Y = [-13, 9], RAIL_H = 4, RAIL_FROM = 14, RAIL_TO = 1196;
const CART_Z = RAIL_H;        // 카트가 레일 위에 얹힘

const X = { dock: 70, install: 182, lint: 270, test: 358, build: 446, merge: 552, after: 600,
            image: 726, reg: 830, stg: 928, pre: 990, appr: 1024, door: 1150, rack: 1198 };
const GATE_H = 72;

const W0 = { origin: [0, 0], scale: SCALE, azimuth: AZ, elevation: EL };
// 전체 경계를 먼저 재서 원점을 정한다
const extremes = [
  ...k.boxCorners({ x: -6, y: BENCH_Y - 6, w: 1302, d: BENCH_D + 12 }, -(SLAB + FRAME + FOOT), 0),
  [40, -70, 76], [X.rack - 90, -78, 124], [X.rack + 90, -78, 124], [140, -60, 112], [X.appr, 40, 150],
];
const flat0 = extremes.map((p) => k.iso(p, W0));
const minX = Math.min(...flat0.map((p) => p[0])), maxX = Math.max(...flat0.map((p) => p[0]));
const minY = Math.min(...flat0.map((p) => p[1])), maxY = Math.max(...flat0.map((p) => p[1]));
const WIDTH = Math.ceil(maxX - minX + PAD * 2), HEIGHT = Math.ceil(maxY - minY + PAD * 2 + 120);
const P = { origin: [PAD - minX, PAD - minY], scale: SCALE, azimuth: AZ, elevation: EL };

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 24, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
const box = (x, y, w, d, z, h, r = 1.2, steps = 3, bevel = 0.5) => slab({ x, y, w, d, r }, z, h, steps, bevel);
const mv = (v) => { const [x, y] = k.axisVector(P, v); return [Math.round(x * 100) / 100, Math.round(y * 100) / 100]; };
const vars = (o) => Object.entries(o).map(([n, [x, y]]) => `--${n}x:${x}px;--${n}y:${y}px`).join(";");
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// 세로 면(y = 일정) 위의 둥근 사각형 윤곽
function faceRect(x0, x1, y, z0, z1, r = 2, steps = 4) {
  const pts = [];
  const c = [[x1 - r, z1 - r, 0], [x1 - r, z0 + r, -90], [x0 + r, z0 + r, -180], [x0 + r, z1 - r, 90]];
  for (const [cx, cz, a0] of c) for (let i = 0; i <= steps; i++) {
    const a = (a0 - (90 * i) / steps) * Math.PI / 180;
    pts.push(at([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]));
  }
  return k.pathOf(pts, true);
}
const faceLine = (x0, x1, y, z) => k.pathOf([at([x0, y, z]), at([x1, y, z])]);

// ---------- 작업대 ----------
function bench(plan) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, -(SLAB + FRAME + FOOT), SLAB + FRAME, P)}"/>`];
  const base = k.insetPlan(plan, 6);
  for (const [x, y] of byDepth(k.corners(base, 16))) {
    out.push(S(cyl(x, y, 7, -(SLAB + FRAME + FOOT), 1.6, 24), { tone: "lo" }));
    out.push(S(cyl(x, y, 5.2, -(SLAB + FRAME + FOOT) + 1.6, FOOT - 1.6, 24), { tone: "mid" }));
  }
  out.push(S(slab(base, -(SLAB + FRAME), FRAME, 6, 0.6), { tone: "lo" }));
  out.push(S(slab(plan, -SLAB, SLAB, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(plan, -SLAB + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 5), TOP, P), { tone: "faint" }));
  const screws = k.corners(plan, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, TOP])), { size: 0.6, tone: "mid" }));
  // 앞쪽 눈금자
  const strip = { x: plan.x + 22, y: FRONT - 16, w: plan.w - 44, d: 8, r: 1 };
  out.push(S(slab(strip, TOP, 0.6, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.6, TOP + 0.6, [2.4, 4.4], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 4, TOP + 0.6]), at([strip.x + strip.w - 2, strip.y + 4, TOP + 0.6])], { size: 0.5 }));
  // 이름판(인쇄된 글 대신 규칙선)
  const tag = { x: plan.x + plan.w - 96, y: BENCH_Y + 8, w: 70, d: 16, r: 1.5 };
  out.push(S(slab(tag, TOP, 0.8, 3), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(tag, 1.6), TOP + 0.8, P, 3), { tone: "faint" }));
  out.push(L([[10, 40], [10, 30], [10, 48]].map(([dx, len], i) => k.lineOnTop([tag.x + dx, tag.y + 5 + i * 3.4], [tag.x + dx + len, tag.y + 5 + i * 3.4], TOP + 0.8, P)).join(""), { tone: "lo", free: true }));
  return out.join("");
}

// 레일 받침이 레일 위로 올라오지 않도록, 받침 먼저 그리고 레일을 나중에
function railsOrdered(from, to, key) {
  const ties = [], bars = [];
  for (let x = from + 10; x < to - 4; x += 36) ties.push(S(box(x, RAIL_Y[0] - 3, 6, RAIL_Y[1] - RAIL_Y[0] + 10, TOP, 1.4, 0.8, 2, 0), { tone: "lo", crease: "none" }));
  for (const y of RAIL_Y) bars.push(S(box(from, y, to - from, 4, TOP + 1.4, RAIL_H - 1.4, 1, 3, 0.4), { tone: "mid" }));
  const dots = RAIL_Y.map((y) => D([from + 4, to - 4].map((x) => at([x, y + 2, RAIL_H])), { size: 0.5 })).join("");
  return `<g class="w" data-w="${key}">${ties.join("")}${bars.join("")}${dots}</g>`;
}

// ---------- CI 검사대: 레일 뒤 기둥 + 레일 위로 뻗은 팔 + 매달린 장치 ----------
const COL_Y = -44, ARM_Z = 58;
function column(gx, name) {
  const out = [];
  out.push(S(box(gx - 14, COL_Y - 12, 28, 22, TOP, 9, 2, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners({ x: gx - 14, y: COL_Y - 12, w: 28, d: 22 }, 3.4).map(([x, y]) => at([x, y, TOP + 9])), { size: 0.45 }));
  out.push(S(cyl(gx, COL_Y, 6, TOP + 9, 4, 28), { tone: "mid" }));
  out.push(S(cyl(gx, COL_Y, 4.2, TOP + 13, 66, 24), { tone: "mid", crease: "none", inner: L([28, 44].map((z) => k.sideArc(gx, COL_Y, 4.2, z, P, 14)).join(""), { tone: "faint" }) }));
  out.push(S(box(gx - 7.5, COL_Y - 7.5, 15, 15, ARM_Z - 4, 14, 2, 3, 0.6), { tone: "mid" }));
  out.push(S(box(gx + 7.5, COL_Y - 1.4, 3, 2.8, ARM_Z + 1, 4, 0.6, 2), { tone: "mid", crease: "none" }));
  out.push(S(cyl(gx + 12.4, COL_Y, 2.4, ARM_Z, 6, 16), { tone: "mid" }));
  out.push(L(k.knurl(gx + 12.4, COL_Y, 2.4, ARM_Z, ARM_Z + 6, 16, P), { tone: "lo" }));
  out.push(lamp(gx, COL_Y, TOP + 79, name));
  return out.join("");
}
const arm = (gx) => S(box(gx - 4, COL_Y + 7.5, 8, -COL_Y - 7.5 + 6, ARM_Z, 6, 1.6, 3, 0.4), { tone: "mid" });
const armEnd = (gx, z0) => [S(box(gx - 6, -6, 12, 12, ARM_Z - 2, 10, 1.6, 3, 0.4), { tone: "mid" }), S(cyl(gx, 0, 2.2, z0, ARM_Z - 2 - z0, 14), { tone: "mid", crease: "none" })].join("");
function lamp(gx, y, z, name) {
  return `<g class="lamp" data-lamp="${name}">${S(cyl(gx, y, 6.4, z, 2, 24), { tone: "mid" })}${S(cyl(gx, y, 5, z + 2, 5, 24, 0.5), { tone: "hi", className: "lamp-cap" })}</g>`;
}
// 설치: 호퍼에서 패키지 상자가 떨어짐
function hopper(gx) {
  const out = [armEnd(gx, 54)];
  const hp = { x: gx - 18, y: -18, w: 36, d: 36, r: 3 };
  out.push(S(slab(hp, 40, 14, 4, 0.8), { tone: "hi", inner: L(k.sideSeam(hp, 45, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(hp, 3.4), 54, P, 4), { tone: "lo" }));
  out.push(D(k.corners(hp, 3).map(([x, y]) => at([x, y, 54])), { size: 0.45 }));
  out.push(S(box(gx - 7, -7, 14, 14, 33, 7, 1.6, 3, 0.4), { tone: "mid" }));
  const drop = [];
  [[-3, -3, 0], [3, 1, 0.33], [0, -1, 0.66]].forEach(([dx, dy, d]) => {
    drop.push(`<g class="pkg" style="animation-delay:${d}s">${S(box(gx + dx - 2.2, dy - 2.2, 4.4, 4.4, 31.5, 4.4, 0.6, 2, 0), { tone: "hi" })}</g>`);
  });
  out.push(`<g class="drops" style="${vars({ f: mv([0, 0, -1]) })}">${drop.join("")}</g>`);
  return out.join("");
}
// 린트: 솔 머리(아래로 솔이 촘촘히)
function brush(gx) {
  const out = [armEnd(gx, 49)];
  const head = { x: gx - 18, y: -11, w: 36, d: 22, r: 2 };
  const bristles = [];
  for (let x = head.x + 1.6; x <= head.x + head.w - 1.6; x += 1.5) bristles.push(k.segment([x, head.y + head.d - 0.6, 40], [x, head.y + head.d - 0.6, 33.5], P));
  const inner = L(k.sideSeam(head, 43, P, 3), { tone: "faint" });
  out.push(`<g class="teeth" style="${vars({ s: mv([2.2, 0, 0]) })}">${L(bristles.join(""), { tone: "mid" })}${S(slab(head, 40, 9, 3, 0.6), { tone: "hi", inner })}${D(k.corners(head, 3).map(([x, y]) => at([x, y, 49])), { size: 0.45 })}</g>`);
  return out.join("");
}
// 테스트: 다이얼 게이지(바늘이 초록 칸/빨간 칸)
const DIAL_R = 21, DIAL_Z = 42, DIAL_TOP = DIAL_Z + 8;
function dial(gx) {
  const out = [];
  out.push(S(box(gx - 4, -4, 8, 8, DIAL_TOP, ARM_Z - DIAL_TOP, 1.2, 2, 0.3), { tone: "mid" }));
  out.push(S(cyl(gx, 0, DIAL_R, DIAL_Z, 8, 72, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(gx, 0, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(gx, 0, DIAL_R, DIAL_TOP - 3.4, P, 40), { tone: "faint" }));
  out.push(L(k.ring(gx, 0, DIAL_R - 2.4, DIAL_TOP, P, 72), { tone: "lo" }));
  const t = k.radialTicks(gx, 0, DIAL_R - 3, 50, 5, DIAL_TOP, [1.4, 3], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const arc = (a0, a1, r) => { const pts = []; for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20; pts.push([gx + Math.sin(a) * r, -Math.cos(a) * r]); } return k.onTop(pts, DIAL_TOP + 0.1, P); };
  out.push(`<path class="iso-line zone ok" d="${arc(-0.5, 0.5, DIAL_R - 5.2)}"/>`);
  out.push(`<path class="iso-line zone ng" d="${arc(1.5, 2.6, DIAL_R - 5.2)}"/>`);
  out.push(`<path class="iso-line zone ng" d="${arc(-2.6, -1.5, DIAL_R - 5.2)}"/>`);
  const needle = (a) => k.lineOnTop([gx - Math.sin(a) * 3.6, Math.cos(a) * 3.6], [gx + Math.sin(a) * (DIAL_R - 5), -Math.cos(a) * (DIAL_R - 5)], DIAL_TOP + 0.3, P);
  out.push(`<path class="iso-line needle n0" data-free="start" d="${needle(-1.2)}"/>`);
  out.push(`<path class="iso-line needle n1" data-free="start" d="${needle(0.06)}"/>`);
  out.push(`<path class="iso-line needle n2" data-free="start" d="${needle(2.05)}"/>`);
  out.push(L(k.ring(gx, 0, 1.8, DIAL_TOP + 0.3, P, 16), { tone: "mid" }));
  // 크라운(옆 손잡이)
  out.push(S(box(gx + DIAL_R - 1, -2.6, 5, 5.2, DIAL_Z + 2, 5, 1.2, 2), { tone: "mid" }));
  out.push(S(box(gx + DIAL_R + 3.6, -3.4, 2.6, 6.8, DIAL_Z + 1.2, 6.6, 1.2, 2), { tone: "mid" }));
  // 측정 막대(플런저): 카트리지 윗면 바로 위까지
  out.push(S(cyl(gx, 0, 1.7, 34, DIAL_Z - 34, 16), { tone: "hi", crease: "none", lit: true }));
  out.push(S(cyl(gx, 0, 2.8, 32.4, 1.6, 16), { tone: "hi", lit: true }));
  return out.join("");
}
// 빌드: 프레스
function press(gx) {
  const out = [armEnd(gx, 52)];
  out.push(S(cyl(gx, 0, 5, 46, 6, 20), { tone: "mid" }));
  const hp = { x: gx - 17, y: -17, w: 34, d: 34, r: 2.4 };
  const head = [S(cyl(gx, 0, 3.2, 44, 8, 16), { tone: "mid", crease: "none" }), S(slab(hp, 35, 9, 4, 0.6), { tone: "hi", inner: L(k.sideSeam(hp, 39, P, 4), { tone: "faint" }) })];
  head.push(D(k.corners(hp, 3.6).map(([x, y]) => at([x, y, 44])), { size: 0.45 }));
  out.push(`<g class="head" style="${vars({ p: mv([0, 0, -3.5]) })}">${head.join("")}</g>`);
  for (const dx of [-13, 13]) out.push(S(cyl(gx + dx, 0, 1.4, 44, 8, 12), { tone: "mid", crease: "none" }));
  return out.join("");
}
// 머지: 자물쇠가 달린 문. 차단봉이 내려오면 막힘
const MG_Y = [-34, 22];
function gpost(gx, y, h) {
  return [S(box(gx - 7, y - 3, 14, 14, TOP, 2.4, 1.6, 3, 0.5), { tone: "lo" }), D([at([gx - 4.5, y - 0.5, TOP + 2.4]), at([gx + 4.5, y + 8.5, TOP + 2.4])], { size: 0.45 }),
    S(box(gx - 4, y, 8, 8, TOP + 2.4, h - 2.4, 1.4, 3, 0.4), { tone: "mid", inner: L(k.sideSeam({ x: gx - 4, y, w: 8, d: 8, r: 1.4 }, h - 12, P, 3), { tone: "faint" }) })].join("");
}
function mergeGate(gx) {
  const H = 76;
  const back = gpost(gx, MG_Y[0], H);
  // 내리닫이 격자문: 세로 막대들이 내려와 레일을 막음, 열리면 위로 올라감
  const rods = [];
  for (let y = MG_Y[0] + 6; y <= MG_Y[1] - 2; y += 6.5) rods.push(S(cyl(gx, y, 1.3, 3, 42, 12), { tone: "hi", crease: "none", lit: true }));
  const grille = `<g class="gbar" style="${vars({ u: mv([0, 0, 36]) })}">${rods.join("")}${S(box(gx - 3, MG_Y[0] + 3, 6, MG_Y[1] - MG_Y[0] - 3, 45, 5, 1.4, 3, 0.4), { tone: "hi", lit: true })}${S(box(gx - 3, MG_Y[0] + 3, 6, MG_Y[1] - MG_Y[0] - 3, 20, 3, 1, 2, 0), { tone: "hi", lit: true })}</g>`;
  const lx = gx, ly = MG_Y[1] + 8;
  const lock = [S(box(lx - 8, ly, 16, 6, 30, 16, 2, 3, 0.6), { tone: "hi", crease: "lo" })];
  const shackle = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18; shackle.push(at([lx - 5 * Math.cos(a), ly + 3, 46 + 6.5 * Math.sin(a)])); }
  lock.push(`<path class="iso-line shackle" data-tone="hi" d="${k.pathOf(shackle)}" style="stroke-width:2.4px"/>`);
  lock.push(L(k.ring(lx, ly + 6, 1.4, 40, P, 12), { tone: "mid" }));
  lock.push(`<path class="iso-line" data-tone="mid" data-free="" d="${k.pathOf([at([lx, ly + 6, 38.6]), at([lx, ly + 6, 34.5])])}"/>`);
  const front = [grille, gpost(gx, MG_Y[1], H),
    S(slab({ x: gx - 6, y: MG_Y[0] - 2, w: 12, d: MG_Y[1] - MG_Y[0] + 12, r: 2 }, H, 8, 3, 0.5), { tone: "mid" }),
    D([at([gx, MG_Y[0] + 2, H + 8]), at([gx, MG_Y[1] + 6, H + 8])], { size: 0.5 }),
    `<g class="lockbody">${lock.join("")}</g>`, lamp(gx, MG_Y[1] - 6, H + 8, "merge")].join("");
  return { back, front };
}
function ciStation(gx, kind, name) {
  const mech = kind === "hopper" ? hopper(gx) : kind === "brush" ? brush(gx) : kind === "dial" ? [armEnd(gx, ARM_Z - 1), dial(gx)].join("") : press(gx);
  return { back: column(gx, name), front: [arm(gx), mech].join("") };
}

// ---------- 내 컴퓨터 ----------
function terminal() {
  const back = [], front = [];
  const mx = 34, my = -62, mw = 78, md = 28;
  back.push(S(box(mx + 18, my + 2, 42, 26, TOP, 3, 2, 4, 0.6), { tone: "lo" }));
  back.push(S(box(mx + 31, my + 10, 16, 10, TOP + 3, 14, 1.5, 3, 0.4), { tone: "mid" }));
  back.push(S(box(mx, my, mw, md, TOP + 17, 52, 4, 6, 0.8), { tone: "mid", inner: L(k.sideSeam({ x: mx, y: my, w: mw, d: md, r: 4 }, TOP + 23, P, 6), { tone: "faint" }) }));
  const fy = my + md;
  back.push(`<path class="iso-line" data-tone="mid" d="${faceRect(mx + 7, mx + mw - 7, fy, TOP + 27, TOP + 63, 3)}"/>`);
  back.push(`<path class="screen" d="${faceRect(mx + 9, mx + mw - 9, fy, TOP + 29, TOP + 61, 2)}"/>`);
  [[13, 34], [13, 22], [19, 30], [19, 18], [13, 26]].forEach(([dx, len], i) => back.push(`<path class="iso-line code" data-free="" d="${faceLine(mx + dx, mx + dx + len, fy, TOP + 56 - i * 5)}"/>`));
  back.push(D([at([mx + mw - 12, fy, TOP + 22])], { size: 1, tone: "hi" }));
  // 키보드(앞쪽)
  const kb = { x: 30, y: 24, w: 82, d: 20, r: 3 };
  front.push(S(slab(kb, TOP, 4, 4, 0.6), { tone: "mid" }));
  front.push(D(k.dotGrid(kb.x + 6, kb.y + 4, 15, 3, 5, TOP + 4, P), { size: 0.9, tone: "mid" }));
  front.push(L(k.lineOnTop([kb.x + 26, kb.y + 16.5], [kb.x + 56, kb.y + 16.5], TOP + 4, P), { tone: "lo" }));
  // 카트가 출발하는 받침
  back.push(S(box(X.dock - 26, RAIL_Y[0] - 6, 6, RAIL_Y[1] - RAIL_Y[0] + 16, TOP, 9, 1.4, 3, 0.4), { tone: "mid" }));
  return { back: back.join(""), front: front.join("") };
}

// ---------- 커밋 카트(움직이는 부품, x=0에서 그려 두고 옮김) ----------
function sled() {
  const out = [];
  out.push(`<path class="iso-halo cart-halo" d="${k.haloOf({ x: -18, y: -16, w: 36, d: 30, r: 3 }, CART_Z, 0.1, P)}" style="filter:blur(4px)"/>`);
  for (const [x, y] of byDepth([[-14, RAIL_Y[0]], [10, RAIL_Y[0]], [-14, RAIL_Y[1]], [10, RAIL_Y[1]]])) out.push(S(box(x, y - 1, 6, 6, CART_Z, 4, 1, 2, 0.3), { tone: "mid" }));
  out.push(S(box(-20, -18, 40, 34, CART_Z + 3, 4, 2.4, 4, 0.6), { tone: "mid" }));
  out.push(D([-14, -5, 5, 14].map((x) => at([x, 14, CART_Z + 7])), { size: 0.45, tone: "lo" }));
  return out.join("");
}
const CART_TOP = CART_Z + 7;
function cartridge() {
  const plan = { x: -13, y: -12, w: 26, d: 22, r: 2.4 };
  const out = [S(slab(plan, CART_TOP, 20, 4, 0.8), { tone: "hi", lit: true, inner: L(k.sideSeam(plan, CART_TOP + 5, P, 4), { tone: "faint" }) })];
  const top = CART_TOP + 20;
  const lab = { x: -9, y: -8, w: 18, d: 14, r: 1.2 };
  out.push(L(k.planOutline(lab, top, P, 3), { tone: "lo" }));
  out.push(L([[-6, 10], [-6, 7], [-6, 12]].map(([x0, len], i) => k.lineOnTop([x0, -5 + i * 3.6], [x0 + len, -5 + i * 3.6], top, P)).join(""), { tone: "lo", free: true }));
  out.push(D(k.corners(plan, 2.4).map(([x, y]) => at([x, y, top])), { size: 0.4, tone: "mid" }));
  return `<g class="c-cart">${out.join("")}</g>`;
}
function crate(cls) {
  const plan = { x: -17, y: -15, w: 34, d: 28, r: 1.6 };
  const h = 28, top = CART_TOP + h;
  const inner = L(k.sideSeam(plan, top - 6, P, 3) + k.sideSeam(plan, CART_TOP + 4, P, 3), { tone: "lo" });
  const out = [S(slab(plan, CART_TOP, h, 3, 0.8), { tone: "hi", lit: true, inner })];
  // 앞면 띠 두 줄(위아래 끝까지), 버전 표식 띠
  for (const x of [-8, 8]) out.push(`<path class="iso-line" data-tone="lo" d="${k.pathOf([at([x, plan.y + plan.d, CART_TOP]), at([x, plan.y + plan.d, top])])}"/>`);
  out.push(`<path class="band" d="${faceRect(-6, 6, plan.y + plan.d, CART_TOP + 9, CART_TOP + 17, 1)}"/>`);
  out.push(L(k.planOutline(k.insetPlan(plan, 3), top, P, 3), { tone: "faint" }));
  out.push(D(k.corners(plan, 3).map(([x, y]) => at([x, y, top])), { size: 0.45, tone: "mid" }));
  return `<g class="c-crate ${cls}">${out.join("")}</g>`;
}
function cart(id) {
  return `<g id="${id}" class="cart">${sled()}${cartridge()}${crate("v2")}${crate("v1")}</g>`;
}

// ---------- CD ----------
// 포장: 열린 성형기. 뒤 벽 + 앞 기둥 두 개 + 윗판 + 누름판
function former(gx) {
  const back = [], front = [];
  const wall = { x: gx - 28, y: -34, w: 56, d: 6, r: 1.4 };
  back.push(S(slab(wall, TOP, 56, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(wall, 20, P, 3), { tone: "faint" }) }));
  back.push(D([[-22, 50], [22, 50], [-22, 8], [22, 8]].map(([dx, z]) => at([gx + dx, -28, z])), { size: 0.5 }));
  // 접힌 상자 판 더미(재료)
  for (let i = 0; i < 5; i++) back.push(S(box(gx + 36, -30, 26, 30, TOP + i * 2.2, 2.2, 0.6, 2, 0), { tone: i === 4 ? "hi" : "mid", crease: "none" }));
  const plate = [S(cyl(gx, 0, 2.8, 48, 8, 16), { tone: "mid", crease: "none" }), S(box(gx - 19, -16, 38, 30, 42, 6, 1.6, 3, 0.5), { tone: "hi" })];
  front.push(`<g class="head" style="${vars({ p: mv([0, 0, -2.5]) })}">${plate.join("")}</g>`);
  for (const dx of [-28, 22]) front.push(S(box(gx + dx, 22, 6, 6, TOP, 56, 1.2, 3, 0.4), { tone: "mid" }));
  const lid = { x: gx - 30, y: -36, w: 60, d: 66, r: 2 };
  front.push(S(slab(lid, 56, 6, 3, 0.6), { tone: "mid" }));
  front.push(L(k.planOutline(k.insetPlan(lid, 5), 62, P, 3), { tone: "faint" }));
  front.push(D(k.corners(lid, 4).map(([x, y]) => at([x, y, 62])), { size: 0.5 }));
  front.push(S(cyl(gx - 6, -6, 11, 62, 12, 32, 0.6), { tone: "mid", inner: L(k.sideArc(gx - 6, -6, 11, 68, P, 20), { tone: "faint" }) }));
  front.push(L(k.knurl(gx - 6, -6, 11, 64, 72, 40, P, 0.6), { tone: "faint" }));
  front.push(lamp(gx + 18, 18, 62, "image"));
  return { back: back.join(""), front: front.join("") };
}
// 보관: 뒤쪽 선반, 상자 v1(원래 있던 것)과 v2(새로 들어올 자리)
function shelf(gx) {
  const out = [];
  const sx = gx - 46, sy = -62, sw = 92, sd = 30;
  for (const [x, y] of byDepth([[sx, sy], [sx + sw - 4, sy], [sx, sy + sd - 4], [sx + sw - 4, sy + sd - 4]])) out.push(S(box(x, y, 4, 4, TOP, 84, 0.8, 2, 0.3), { tone: "mid" }));
  const boardsBelow = [S(box(sx - 2, sy - 2, sw + 4, sd + 4, 6, 3, 1.4, 3, 0.4), { tone: "mid" })];
  out.push(boardsBelow.join(""));
  // 아래 칸: 오래된 상자들
  [[-40, 0.8], [-12, 0.6]].forEach(([dx]) => out.push(S(box(gx + dx, sy + 4, 22, 20, 9, 16, 1, 3, 0.5), { tone: "mid", crease: "lo" })));
  out.push(S(box(sx - 2, sy - 2, sw + 4, sd + 4, 40, 3, 1.4, 3, 0.4), { tone: "mid" }));
  const slot = (dx, v) => {
    const plan = { x: gx + dx, y: sy + 3, w: 32, d: 22, r: 1.4 };
    const top = 43 + 24;
    const inner = L(k.sideSeam(plan, top - 5, P, 3), { tone: "lo" });
    const b = [S(slab(plan, 43, 24, 3, 0.6), { tone: "hi", inner })];
    b.push(`<path class="band" d="${faceRect(plan.x + 10, plan.x + 22, plan.y + plan.d, 50, 57, 1)}"/>`);
    b.push(D(k.corners(plan, 3).map(([x, y]) => at([x, y, top])), { size: 0.4 }));
    return `<g class="crate shelf-${v}" data-v="${v}">${b.join("")}</g>`;
  };
  out.push(slot(-40, "v1"), slot(-4, "v2"));
  out.push(S(box(sx - 2, sy - 2, sw + 4, sd + 4, 84, 3, 1.4, 3, 0.4), { tone: "mid" }));
  out.push(D(k.corners({ x: sx - 2, y: sy - 2, w: sw + 4, d: sd + 4 }, 3).map(([x, y]) => at([x, y, 87])), { size: 0.45 }));
  return out.join("");
}
// 스테이징: 운영과 같은 모양의 작은 랙 + 확인 램프
function miniRack(gx) {
  const out = [];
  const rx = gx - 26, ry = -62, rw = 52, rd = 30;
  out.push(S(box(rx, ry, rw, rd, TOP, 60, 2.4, 4, 0.8), { tone: "mid", inner: L(k.sideSeam({ x: rx, y: ry, w: rw, d: rd, r: 2.4 }, 8, P, 4), { tone: "faint" }) }));
  const fy = ry + rd;
  out.push(`<path class="iso-line" data-tone="lo" d="${faceRect(rx + 5, rx + rw - 5, fy, 12, 54, 1.6)}"/>`);
  [16, 30].forEach((z) => {
    out.push(`<path class="blade" d="${faceRect(rx + 8, rx + rw - 8, fy, z, z + 10, 1)}"/>`);
    out.push(`<circle class="led stg-led" cx="${at([rx + rw - 14, fy, z + 5])[0].toFixed(1)}" cy="${at([rx + rw - 14, fy, z + 5])[1].toFixed(1)}" r="2.6"/>`);
  });
  out.push(D(k.dotGrid(rx + 8, ry + 6, 8, 3, 5, 60, P), { size: 0.7, tone: "lo" }));
  out.push(lamp(rx + rw - 10, ry + 8, 60, "stg"));
  return out.join("");
}
// 승인: 사람이 누르는 큰 버튼 콘솔 + 레일 사이에서 올라온 멈춤판. Deployment에서는 둘 다 없고 자리만 남음
function approval(gx) {
  const front = [];
  // 멈춤판이 들어가는 홈(항상 보임)
  front.push(L(k.planOutline({ x: gx - 7, y: -9, w: 14, d: 18, r: 1.4 }, TOP + 0.1, P, 3), { tone: "lo" }));
  const stop = [S(box(gx - 6, -8, 12, 16, TOP, 22, 1.4, 3, 0.5), { tone: "hi", className: "stopper" })];
  for (const z of [5, 13]) stop.push(`<path class="stripe" d="${faceRect(gx - 6, gx + 6, 8, TOP + z, TOP + z + 4, 0.4, 1)}"/>`);
  front.push(`<g class="stop" style="${vars({ d: mv([0, 0, -10]) })}">${stop.join("")}</g>`);
  // 콘솔(레일 앞)
  const con = [];
  const base = { x: gx + 16, y: 20, w: 36, d: 22, r: 2.4 };
  con.push(S(slab(base, TOP, 26, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(base, TOP + 6, P, 4), { tone: "faint" }) }));
  con.push(L(k.planOutline(k.insetPlan(base, 3), TOP + 26, P, 4), { tone: "faint" }));
  con.push(D(k.corners(base, 3).map(([x, y]) => at([x, y, TOP + 26])), { size: 0.45 }));
  con.push(S(cyl(gx + 30, 31, 10, TOP + 26, 2.4, 40), { tone: "mid" }));
  con.push(`<g class="btn" style="${vars({ b: mv([0, 0, -2.2]) })}">${S(cyl(gx + 30, 31, 7.6, TOP + 28.4, 5, 40, 0.8), { tone: "hi", lit: true, className: "button" })}</g>`);
  con.push(S(cyl(gx + 46, 26, 2.6, TOP + 26, 3, 16), { tone: "mid" }));
  con.push(L(k.lineOnTop([gx + 44.6, 26], [gx + 47.4, 26], TOP + 29, P), { tone: "hi" }));
  // 콘솔에서 멈춤판 홈까지 이어진 신호선(바닥 홈 안)
  con.push(L(k.onTop([[gx + 16, 31], [gx + 4, 31], [gx + 4, 9]], TOP + 0.1, P), { tone: "lo" }));
  front.push(`<g class="console">${con.join("")}</g>`);
  return { back: "", front: front.join("") };
}
// 운영: 서버 랙. 블레이드 12장(3열 4단), 각 블레이드에 LED
function rack(gx) {
  const out = [];
  const rx = gx - 92, ry = -64, rw = 184, rd = 44;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: rx, y: ry, w: rw, d: rd, r: 4 }, TOP, 2, P)}"/>`);
  for (const [x, y] of byDepth(k.corners({ x: rx, y: ry, w: rw, d: rd }, 8))) out.push(S(cyl(x, y, 4.6, TOP, 4, 20), { tone: "lo" }));
  out.push(S(box(rx, ry, rw, rd, TOP + 4, 116, 4, 6, 1), { tone: "mid", inner: L(k.sideSeam({ x: rx, y: ry, w: rw, d: rd, r: 4 }, TOP + 14, P, 6) + k.sideSeam({ x: rx, y: ry, w: rw, d: rd, r: 4 }, TOP + 110, P, 6), { tone: "faint" }) }));
  const fy = ry + rd;
  out.push(`<path class="iso-line" data-tone="lo" d="${faceRect(rx + 8, rx + rw - 8, fy, TOP + 18, TOP + 106, 2)}"/>`);
  const cells = [];
  const cw = 50, ch = 16, gap = 6, col0 = rx + 14;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const x0 = col0 + col * (cw + gap), z0 = TOP + 86 - row * (ch + 4.5);
    const led = at([x0 + cw - 8, fy, z0 + ch / 2]);
    cells.push(`<g class="blade-g"><path class="blade" d="${faceRect(x0, x0 + cw, fy, z0, z0 + ch, 1.2)}"/>` +
      `<path class="iso-line" data-tone="faint" data-free="" d="${faceLine(x0 + 5, x0 + 24, fy, z0 + ch / 2)}"/>` +
      `<circle class="led" cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="3.2"/></g>`);
  }
  out.push(`<g class="cells">${cells.join("")}</g>`);
  out.push(D(k.dotGrid(rx + 12, ry + 8, 28, 5, 6, TOP + 120, P), { size: 0.7, tone: "lo" }));
  out.push(L(k.planOutline({ x: rx + 6, y: ry + 4, w: rw - 12, d: rd - 8, r: 2 }, TOP + 120, P, 4), { tone: "faint" }));
  // 손잡이
  for (const x of [rx + 4, rx + rw - 8]) out.push(S(box(x, fy, 4, 3, TOP + 40, 34, 1, 2, 0.3), { tone: "mid" }));
  // 적재 받침(레일 끝)
  out.push(S(box(X.door - 22, RAIL_Y[0] - 8, 44, RAIL_Y[1] - RAIL_Y[0] + 18, TOP, 1.6, 1.6, 3, 0.4), { tone: "lo" }));
  return out.join("");
}

// ---------- 러너 덮개(CI 구간을 덮는 틀) ----------
const HOOD = { x0: 146, x1: 484, y0: -58, y1: 44, h: 110 };
function hood(part) {
  const { x0, x1, y0, y1, h } = HOOD;
  const post = (x, y) => S(box(x - 2.5, y - 2.5, 5, 5, TOP, h, 1, 2, 0.3), { tone: "mid" });
  const barX = (y) => S(box(x0 - 3, y - 3, x1 - x0 + 6, 6, h, 5, 1.4, 3, 0.4), { tone: "mid" });
  const barY = (x) => S(box(x - 3, y0 - 3, 6, y1 - y0 + 6, h, 5, 1.4, 3, 0.4), { tone: "mid" });
  if (part === "back") return [post(x0, y0), post(x1, y0), barX(y0)].join("");
  return [barY(x0), barY(x1), post(x0, y1), post(x1, y1), barX(y1), D([[x0, y1], [x1, y1], [x0, y0], [x1, y0]].map(([x, y]) => at([x, y, h + 5])), { size: 0.55, tone: "mid" })].join("");
}

// ---------- 조립 ----------
const g = (cls, name, body, extra = "") => `<g class="w ${cls}" data-w="${name}"${extra}>${body}</g>`;
const term = terminal();
const gates = [["install", "hopper"], ["lint", "brush"], ["test", "dial"], ["build", "press"]].map(([n, kind]) => ({ n, ...ciStation(X[n], kind, n) }));
const mg = mergeGate(X.merge);
const fm = former(X.image);
const br = approval(X.appr);

const BACK = [
  bench(CI_BENCH), bench(CD_BENCH),
  // 두 작업대를 잇는 연결판
  S(box(612, -40, 38, 80, -4, 4, 2, 3, 0.5), { tone: "lo" }),
  railsOrdered(RAIL_FROM, 622, "tube"), railsOrdered(622, RAIL_TO, "rail"),
  g("st", "runner", hood("back")),
  g("st", "dev", term.back),
  ...gates.map((s) => g("st", s.n, s.back)),
  g("st", "merge", mg.back),
  g("st", "image", fm.back),
  g("st", "reg", shelf(X.reg)),
  g("st", "stg", miniRack(X.stg)),
  g("st", "prod", rack(X.rack)),
].join("");
const MID = `${cart("wLoop")}${cart("wCart")}`;
const FRONT_L = [
  g("st", "dev", term.front),
  ...gates.map((s) => g("st", s.n, s.front)),
  g("st", "merge", mg.front),
  g("st", "image", fm.front),
  g("st", "appr", br.front),
  g("st", "runner", hood("front")),
].join("");

const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: "작업대 위 조립 라인: 커밋 카트리지가 설치, 린트, 테스트, 빌드 문을 지나 머지되고, 상자로 포장돼 선반에 보관된 뒤 스테이징과 승인 차단기를 거쳐 서버 랙으로 들어감", body: [BACK, MID, FRONT_L] });

// ---------- 발표 페이지가 쓸 좌표 ----------
const pt = (p) => { const [x, y] = at(p); return [Math.round(x), Math.round(y)]; };
const OUT_Z = { install: 92, lint: 92, test: 92, build: 92, merge: 90, image: 80, reg: 96, stg: 72, appr: 40, prod: 128, entry: 40 };
const stationX = { dev: 74, entry: 116, install: X.install, lint: X.lint, test: X.test, build: X.build, merge: X.merge, image: X.image, reg: X.reg, stg: X.stg, appr: X.appr, prod: X.rack };
const anchors = {};
for (const [n, x] of Object.entries(stationX)) {
  const oy = ["install", "lint", "test", "build"].includes(n) ? COL_Y : n === "merge" ? 16 : ["reg", "stg", "prod"].includes(n) ? -50 : 0;
  anchors[n] = { top: pt([x, oy, OUT_Z[n] ?? 60]), label: pt([x, FRONT, -(SLAB + FRAME + FOOT)]) };
}
anchors.prod.label = pt([X.rack, FRONT, -(SLAB + FRAME + FOOT)]);
const cartAt = {};
for (const [n, x] of Object.entries({ dev: X.dock, entry: 116, install: X.install, lint: X.lint, test: X.test, build: X.build, merge: X.merge - 30, gate: X.merge, after: X.after + 30, rail: 664, image: X.image, reg: X.reg, stg: X.stg, pre: X.pre - 6, appr: X.appr, door: X.door })) cartAt[n] = mv([x, 0, 0]);
cartAt.inside = mv([X.door, -30, 0]);
const region = (x0, x1) => {
  const pts = [...k.boxCorners({ x: x0, y: BENCH_Y, w: x1 - x0, d: BENCH_D }, -(SLAB + FRAME + FOOT), 0), [x0 + 30, -66, 70], [x1 - 30, -44, GATE_H + 10]].map(pt);
  return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
};
const brk = (x0, x1) => ({ a: pt([x0, -60, 120]), b: pt([x1, -60, 120]) });
const json = {
  width: WIDTH, height: HEIGHT, anchors, cartAt, slope: Math.atan2(...(() => { const v = mv([100, 0, 0]); return [v[1], v[0]]; })()) * 180 / Math.PI,
  regions: { ci: region(0, 622), cd: region(640, 1290), all: region(0, 1290), prod: region(X.rack - 110, X.rack + 100) },
  brackets: { ci: brk(150, 600), cd: brk(690, 1260) },
  hood: pt([HOOD.x0, HOOD.y0, HOOD.h + 5]), ver: pt([X.rack + 70, -64, 124]), cartTop: pt([0, 30, 0]),
  loop: { from: mv([X.dock, 0, 0]), to: mv([X.door, 0, 0]), at: Object.fromEntries(["install", "lint", "test", "build", "merge", "image", "reg", "stg"].map((n) => [n, (X[n] - X.dock) / (X.door - X.dock)])) },
};
writeFileSync(join(HERE, "world.svg"), svg);
writeFileSync(join(HERE, "world.json"), JSON.stringify(json));
console.log(`world.svg ${Math.round(svg.length / 1024)}KB  ${WIDTH}×${HEIGHT}  slope ${json.slope.toFixed(1)}°`);
