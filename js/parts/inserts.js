/* 差し込む物: 温度計・毛細管・栓・乾燥管・撹拌棒・シリンジ */

import { define, pJoint, pRange, pBool, pSelect } from "./registry.js";
import { Shape, P, tubeSeg, cone, jdim, roundRect, rect, poly, line, ellipse, circle } from "../draw.js";

const pAutoDepth = pBool("autoDepth", "差し込む深さを自動で合わせる", true);

/** 差し込む深さ: 自動なら相手の口から決まる値、無ければ手で決めた値 */
function depthOf(p, ctx) {
  return p.autoDepth && ctx.probe != null ? ctx.probe : Number(p.depth);
}

/** すり合わせ付きの短い首 (温度計アダプターなど) */
function collar(sh, j, h, layer) {
  sh.union([tubeSeg(0, 0, 0, -h, j.wt)], "glass", layer);
}

/* ---- 温度計 ---- */
define({
  type: "thermometer",
  name: { ja: "温度計", en: "thermometer" },
  cat: "insert",
  params: [
    pJoint("joint", "すり合わせ", "14/20"),
    pAutoDepth,
    pRange("depth", "差し込む深さ", 0, 250, 5, 40, "mm"),
    pRange("length", "上に出る長さ", 60, 250, 10, 130, "mm"),
  ],
  build(p, ctx = {}) {
    const sh = new Shape();
    const j = jdim(p.joint);
    const depth = depthOf(p, ctx), top = -Number(p.length);
    const yb = depth + 6;
    cone(sh, 0, 0, 90, p.joint);
    collar(sh, j, 12, "over");
    sh.union([tubeSeg(0, yb, 0, top, 5.5), ellipse(0, yb, 3.3, 7.5)], "glass", "over");
    sh.path(line(0, yb - 4, 0, top * 0.45), "thin", "over");
    sh.path(roundRect(-j.wt / 2 - 2, -20, j.wt + 4, 9, 2), "rubber", "over");
    sh.path(poly([[-1.6, top], [1.6, top], [1.2, top - 2], [-1.2, top - 2]]), "glass", "over");
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [0, top * 0.6];
    return sh;
  },
});

/* ---- 毛細管 (減圧蒸留の突沸防止) ---- */
define({
  type: "capillary",
  name: { ja: "毛細管", en: "capillary bleed" },
  cat: "insert",
  params: [
    pJoint(),
    pAutoDepth,
    pRange("depth", "差し込む深さ", 0, 300, 5, 120, "mm"),
    pBool("clamp", "ピンチコック", true),
  ],
  build(p, ctx = {}) {
    const sh = new Shape();
    const j = jdim(p.joint);
    const depth = depthOf(p, ctx), top = -70;
    cone(sh, 0, 0, 90, p.joint);
    collar(sh, j, 14, "over");
    sh.union([tubeSeg(0, depth, 0, top + 20, 3.6)], "glass", "over");
    sh.path(line(0, depth, 0, top + 20), "hair", "over");
    sh.path(roundRect(-j.wt / 2 - 1.5, -22, j.wt + 3, 9, 2), "rubber", "over");
    sh.path(roundRect(-3.5, top - 4, 7, 26, 2), "rubber", "over");
    if (p.clamp) {
      sh.path(roundRect(-8, top + 4, 16, 3, 1), "metal", "over");
      sh.path(roundRect(-8, top + 10, 16, 3, 1), "metal", "over");
      sh.path(rect(5.5, top + 2, 2.5, 13), "metal", "over");
    }
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [0, top + 30];
    return sh;
  },
});

/* ---- 共通すり合わせ栓 ---- */
define({
  type: "stopper",
  name: { ja: "栓", en: "stopper" },
  cat: "insert",
  labelDefault: false,
  params: [pJoint(), pSelect("kind", "種類", [["glass", "ガラス栓"], ["septum", "セプタム (ゴム)"]], "glass")],
  label: (p, lang) => (p.kind === "septum" ? (lang === "en" ? "septum" : "セプタム") : lang === "en" ? "stopper" : "栓"),
  build(p) {
    const sh = new Shape();
    const j = jdim(p.joint);
    if (p.kind === "septum") {
      sh.path(roundRect(-j.wo / 2 - 1.5, -14, j.wo + 3, 16, 3), "rubber");
      sh.path(roundRect(-j.wt / 2 + 2, -20, j.wt - 4, 7, 2), "rubber");
      sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
      sh.anchor = [0, -10];
      return sh;
    }
    cone(sh, 0, 0, 90, p.joint);
    sh.union([tubeSeg(0, 0, 0, -6, j.wt * 0.7), roundRect(-j.wt / 2 - 2, -15, j.wt + 4, 9, 3)]);
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [0, -10];
    return sh;
  },
});

/* ---- 塩化カルシウム管 (乾燥管) ---- */
define({
  type: "dryingTube",
  name: { ja: "塩化カルシウム管", en: "drying tube" },
  cat: "insert",
  params: [pJoint()],
  build(p) {
    const sh = new Shape();
    const j = jdim(p.joint);
    const pieces = [tubeSeg(0, 0, 0, -16, j.wt * 0.55), circle(0, -28, 12), tubeSeg(0, -28, 0, -84, 15), rect(-5, -90, 10, 8)];
    sh.union(pieces);
    // 乾燥剤の粒 (まばらな点)
    for (let y = -40, k = 0; y > -76; y -= 7, k++) {
      for (const x of k % 2 ? [-3.5, 3.5] : [-5, 0, 5]) sh.path(circle(x, y, 0.9), "ink");
    }
    sh.path(line(-7.5, -80, 7.5, -80), "thin");
    cone(sh, 0, 0, 90, p.joint);
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [0, -60];
    return sh;
  },
});

/* ---- メカニカルスターラー (撹拌棒・撹拌羽根) ---- */
define({
  type: "mechStirrer",
  name: { ja: "メカニカルスターラー", en: "overhead stirrer" },
  cat: "insert",
  keywords: ["撹拌", "攪拌", "かくはん", "撹拌羽根", "mechanical stirrer"],
  params: [
    pJoint(),
    pAutoDepth,
    pRange("depth", "差し込む深さ", 0, 300, 5, 80, "mm"),
    pSelect("blade", "羽根", [["crescent", "半月形"], ["paddle", "板形"], ["propeller", "プロペラ"]], "crescent"),
    pBool("motor", "モーター", true),
    pRange("height", "モーターの高さ", 100, 400, 10, 160, "mm"),
  ],
  label: (p, lang) => (lang === "en" ? "overhead stirrer" : "メカニカルスターラー"),
  build(p, ctx = {}) {
    const sh = new Shape();
    const j = jdim(p.joint);
    const depth = Math.max(20, depthOf(p, ctx) - 4);
    const top = -Math.max(100, Number(p.height) || 160);
    cone(sh, 0, 0, 90, p.joint);
    // 軸受け (撹拌シール) と撹拌棒
    sh.union([tubeSeg(0, 0, 0, -16, j.wt), tubeSeg(0, -16, 0, -44, j.wt * 0.55), roundRect(-j.wt * 0.42, -50, j.wt * 0.84, 8, 2)], "glass", "over");
    const ys = top + (p.motor ? 52 : 4);
    sh.path(rect(-2, ys, 4, depth - 2 - ys), "glass", "over");
    const bw = Math.min(26, depth * 0.5 + 8);
    if (p.blade === "crescent") {
      sh.path(new P().M(-bw, depth - 8).L(bw, depth - 8).Q(bw * 0.9, depth + 7, 0, depth + 7).Q(-bw * 0.9, depth + 7, -bw, depth - 8).Z(), "glass", "over");
    } else if (p.blade === "paddle") {
      sh.path(rect(-bw * 0.7, depth - 16, bw * 1.4, 16), "glass", "over");
    } else {
      sh.path(poly([[0, depth - 4], [-bw * 0.8, depth - 9], [-bw * 0.8, depth - 2]]), "glass", "over");
      sh.path(poly([[0, depth - 4], [bw * 0.8, depth + 1], [bw * 0.8, depth - 6]]), "glass", "over");
    }
    if (p.motor) {
      // モーター本体とチャック
      sh.path(rect(-6, top + 40, 12, 12), "metal", "over");
      sh.path(roundRect(-26, top, 52, 40, 3), "solid", "over");
      sh.path(circle(14, top + 12, 3.5), "line", "over");
    } else {
      sh.path(roundRect(-6, top - 4, 12, 8, 2), "metal", "over");
    }
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [p.motor ? -26 : 0, p.motor ? top + 20 : -30];
    return sh;
  },
});

/* ---- シリンジ (セプタム越しに入れる) ---- */
define({
  type: "syringe",
  name: { ja: "シリンジ (セプタム付き)", en: "syringe through septum" },
  cat: "insert",
  keywords: ["注射器", "セプタム", "針", "syringe", "needle"],
  params: [
    pJoint("joint", "すり合わせ", "14/20"),
    pAutoDepth,
    pRange("depth", "針の深さ", 0, 250, 5, 40, "mm"),
    pSelect("volume", "容量", [[1, "1 mL"], [5, "5 mL"], [10, "10 mL"], [20, "20 mL"]], 10),
    pRange("fill", "中身", 0, 1, 0.05, 0.6, "%"),
  ],
  label: (p, lang) => (lang === "en" ? `syringe (${p.volume} mL)` : `シリンジ (${p.volume} mL)`),
  build(p, ctx = {}) {
    const sh = new Shape();
    const j = jdim(p.joint);
    const v = Number(p.volume);
    const tip = Math.max(10, depthOf(p, ctx) * 0.6);
    const bw = 5 + 3.2 * Math.cbrt(v), bl = 40 + 10 * Math.cbrt(v);
    const yn = -40, yb = yn - 8;             // 針の根元と、筒の下端
    // 針の上にセプタム (ゴム栓) を重ねて、ゴムの中の針を隠す
    sh.path(line(0, yn, 0, tip), "line", "over");
    sh.path(roundRect(-j.wo / 2 - 1.5, -14, j.wo + 3, 16, 3), "rubber", "over");
    sh.path(roundRect(-j.wt / 2 + 2, -20, j.wt - 4, 7, 2), "rubber", "over");
    sh.union([poly([[-2.5, yn], [2.5, yn], [3.5, yb], [-3.5, yb]]), rect(-bw / 2, yb - bl, bw, bl), rect(-bw / 2 - 4, yb - bl - 2, bw + 8, 2.5)], "glass", "over");
    const yp = yb - bl * Math.max(0.05, Number(p.fill));
    if (p.fill > 0) sh.liquid([rect(-bw / 2, yb - bl, bw, bl)], yp, 0, { color: "#c9d3dc" }, "over");
    sh.path(rect(-bw / 2 + 0.6, yp - 4, bw - 1.2, 4), "solid", "over");
    sh.path(rect(-1.2, yb - bl - 34, 2.4, yp - 4 - (yb - bl - 34)), "line", "over");
    sh.path(roundRect(-bw / 2 - 2, yb - bl - 38, bw + 4, 4, 1), "solid", "over");
    for (let k = 1; k < 5; k++) sh.path(line(bw / 2, yb - (bl * k) / 5, bw / 2 - 3, yb - (bl * k) / 5), "hair", "over");
    sh.port("joint", "joint", 0, 0, 90, { size: p.joint, gender: "M", param: "joint" });
    sh.anchor = [0, yb - bl * 0.5];
    return sh;
  },
});
