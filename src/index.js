let my = {};
my.exs = [
  [{ x: 0, y: 0, q: 1 }],
  [
    { x: -1.2, y: 0, q: 1 },
    { x: 1.2, y: 0, q: -1 },
  ],
  [
    { x: -1.2, y: 0, q: 1 },
    { x: 1.2, y: 0, q: 1 },
  ],
  [
    { x: -1.2, y: 0, q: -1 },
    { x: 1.2, y: 0, q: -1 },
  ],
  [
    { x: -1, y: 0, q: 1 },
    { x: 1, y: 0, q: 1 },
    { x: 0, y: 1, q: -1 },
    { x: 0, y: -1, q: -1 },
  ],
  [
    { x: -1, y: 0, q: -1 },
    { x: 1, y: 0, q: -1 },
    { x: 0, y: 1, q: -1 },
    { x: 0, y: -1, q: 3 },
  ],
  [
    { x: -0.13, y: -1.13, q: -1 },
    { x: 0.09, y: -0.03, q: -1 },
    { x: 0.31, y: 1.14, q: -1 },
    { x: 1.55, y: -1.07, q: 1 },
    { x: -1.62, y: -0.23, q: 1 },
    { x: 1.8, y: 0.09, q: 1 },
    { x: -1.2, y: 1.06, q: 1 },
  ],
];
my.exN = 1;
my.addNext = { x: -1, y: -1.6 };
let TWO_PI = Math.PI * 2;
let source_lines_per_unit_charge = 10;
let k = 10;
let step = 0.06;
let start_step = 0.001;
let max_steps = 2000;
let Utolerance = 0.001;
let step_equi = 0.05;
let max_equi_step = 200;
let potential_multiple = 3;
let hide_charge_values = false;
let myRandom = [];
for (let r = 0; r < 7; r++) myRandom.push((Math.PI * 2 * r) / 7);
for (let r = 1; r < 15; r++) myRandom.push((Math.PI * 2 * r) / 15);
for (let r = 2; r < 1000; r++) myRandom.push(Math.random() * Math.PI * 2);
function init() {
  let version = "0.52";
  console.log("init", version);
  my.wd = 600;
  my.ht = 500;
  let chrgs = ["&minus;3", "&minus;2", "&minus;1", "+1", "+2", "+3"];
  let btnStr = "";
  for (let i in chrgs) {
    let chrg = chrgs[i];
    btnStr += wrap(
      {
        tag: "btn",
        fn: "chargeAdd(" + parseInt(chrg.replace("&minus;", "-")) + ")",
      },
      chrg
    );
  }
  let s = wrap(
    { cls: "js", style: "" },
    "Examples ",
    wrap({ tag: "btn", fn: "exNext(-1)" }, "<"),
    wrap({ tag: "btn", fn: "exNext(1)" }, ">"),
    " | ",
    "Add " + btnStr,
    " | ",
    wrap({ tag: "btn", fn: "canvasSave('jpg')" }, "Save"),
    "<br>",
    '<div  style="position:relative; margin:auto; width:' +
      my.wd +
      "px; height:" +
      my.ht +
      'px;" >',
    '<canvas id="can" style="position:absolute; left:0; top:0;"></canvas>',
    '<canvas id="can2" style="position:absolute; left:0;  top:0;"></canvas>',
    "</div>",
    "<br>",
    ' <div id="totalenergy"></div>',
    `    <div style="display:inline-block">
<div style="margin:5px"><label><input type ="checkbox" id="ctl-do-eqipotential" />Show Equipotential Lines (slow)</label></div>
</div>`,
    wrap({ cls: "copyrt" }, `&copy; 2024 Rod Pierce v${version}`)
  );
  docInsert(s);
  my.can = new Can("can", my.wd, my.ht, 2);
  my.can2 = new Can("can2", my.wd, my.ht, 2);
  my.field = new Field(my.can);
}
function exNext(n) {
  my.field.exNext(n);
}
function chargeAdd(q) {
  my.field.chargeAdd(q);
}
class Field {
  constructor(can) {
    this.can = can;
    this.g = can.g;
    this.ctx = can.g;
    this.scale = 100;
    this.bg_color = "255,255,255";
    this.origin_x = 0.0;
    this.origin_y = 0.0;
    this.width_x = 10.0;
    this.dragging = false;
    this.width_x -= 3;
    this.estMode = 4;
    console.log("this.estMode", this.estMode);
    this.charges = [];
    this.exNext(0);
    let self = this;
    window.addEventListener("resize", function (ev) {
      return self.draw(ev);
    });
    window.addEventListener("mousemove", function (ev) {
      return self.mouseDo(ev);
    });
    my.can2.el.addEventListener("mousedown", function (ev) {
      return self.mouseDo(ev);
    });
    window.addEventListener("mouseup", function (ev) {
      return self.mouseDo(ev);
    });
    my.can2.el.addEventListener("mouseout", function (ev) {
      return self.mouseDo(ev);
    });
    my.can2.el.addEventListener("touchstart", function (ev) {
      return self.mouseDo(ev);
    });
    window.addEventListener("touchmove", function (ev) {
      return self.mouseDo(ev);
    });
    window.addEventListener("touchend", function (ev) {
      return self.mouseDo(ev);
    });
    document
      .querySelector("#ctl-do-eqipotential")
      .addEventListener("click", function () {
        self.draw();
      });
  }
  exNext(n) {
    my.exN += n;
    if (my.exN < 0) my.exN += my.exs.length;
    my.exN = my.exN % my.exs.length;
    let ex = my.exs[my.exN];
    console.log("exNext", my.exN, ex);
    this.charges = [];
    for (let i in ex) {
      let chg = ex[i];
      this.charges.push({
        x: chg.x,
        y: chg.y,
        q: chg.q,
        r: Math.sqrt(chg.q) * 0.12,
      });
    }
    this.fieldLinesFind();
    this.draw();
  }
  zoomDo(zoom) {
    this.width_x -= zoom;
    this.draw();
  }
  fld(x, y) {
    let Ex = 0;
    let Ey = 0;
    let U = 0;
    let dUdx = 0;
    for (let i = 0; i < this.charges.length; i++) {
      let c = this.charges[i];
      let dx = x - c.x;
      let dy = y - c.y;
      let r2 = dx * dx + dy * dy;
      let r = Math.sqrt(r2);
      let E = (2 * c.q) / r;
      Ex += (dx / r) * E;
      Ey += (dy / r) * E;
      U += -2 * c.q * Math.log(r);
    }
    let E2 = Ex * Ex + Ey * Ey;
    let E = Math.sqrt(E2);
    let ret = {
      x: x,
      y: y,
      U: U,
      E: E,
      Ex: Ex,
      Ey: Ey,
      gx: Ex / E,
      gy: Ey / E,
    };
    return ret;
  }
  collisionFind(x, y, tol = -0.0001) {
    for (let i = 0; i < this.charges.length; i++) {
      let c = this.charges[i];
      let dx = x - c.x;
      let dy = y - c.y;
      let r2 = dx * dx + dy * dy;
      let cr = c.r + tol;
      if (r2 < cr * cr) {
        return c;
      }
    }
    return null;
  }
  nodePositionFind(charge) {
    if (charge.nodes.length == 0 && charge.nodesNeeded.length == 0) {
      this.SeedNodes(charge, 0);
    }
    if (charge.nodesNeeded && charge.nodesNeeded.length > 0) {
      let t = charge.nodesNeeded.shift();
      charge.nodes.push(t);
      return t;
    }
    charge.nodes.sort();
    let biggest_gap = 0;
    let gap_after = 0;
    for (let i = 0; i < charge.nodes.length; i++) {
      let t1 = charge.nodes[i];
      let t2;
      if (i + 1 < charge.nodes.length) t2 = charge.nodes[i + 1];
      else t2 = charge.nodes[(i + 1) % charge.nodes.length] + TWO_PI;
      let dt = Math.abs(t2 - t1);
      if (dt > biggest_gap) {
        gap_after = i;
        biggest_gap = dt;
      }
    }
    let new_node = (charge.nodes[gap_after] + biggest_gap * 0.5) % TWO_PI;
    charge.nodes.push(new_node);
    return new_node;
  }
  positionOfUFind(input, Utarget, Utolerance) {
    let out = input;
    let it = 0;
    while (Math.abs(out.U - Utarget) > Utolerance) {
      it++;
      let delta = (out.U - Utarget) / out.E;
      let x = out.x + delta * out.gx;
      let y = out.y + delta * out.gy;
      if (isNaN(x) || isNaN(y)) debugger;
      out = this.fld(x, y);
    }
    return out;
  }
  SeedNodes(charge, startangle) {
    for (let j = 0; j < charge.n_nodes; j++) {
      charge.nodesNeeded.push(
        (startangle + (TWO_PI * j) / charge.n_nodes) % TWO_PI
      );
    }
  }
  collisionDo(collide, x, y) {
    let dx = x - collide.x;
    let dy = y - collide.y;
    let angle = (Math.atan2(dy, dx) + TWO_PI) % TWO_PI;
    collide.nodes.push(angle);
    collide.nodesUsed.push(angle);
    if (collide.nodesUsed.length == 1) {
      this.SeedNodes(collide, angle);
    }
    let best = 0;
    let bestdiff = 9e9;
    for (let k = 0; k < collide.nodesNeeded.length; k++) {
      let diff = Math.abs((collide.nodesNeeded[k] - angle) % (2 * Math.PI));
      if (diff < bestdiff) {
        bestdiff = diff;
        best = k;
      }
    }
    collide.nodesNeeded.splice(best, 1);
  }
  fieldLineTrace(fieldline) {
    let x = fieldline.start_x;
    let y = fieldline.start_y;
    fieldline.points = [{ x: x, y: y }];
    let lastE = this.fld(x, y);
    let traceFinished = false;
    let nstep = 0;
    let dist = 0;
    while (true) {
      nstep++;
      let E = this.fld(x, y);
      let h = step * fieldline.dir;
      if (this.estMode == 1) {
        let dx = E.gx * h;
        let dy = E.gy * h;
        x += dx;
        y += dy;
        dist += h;
      } else {
        h = h * 2;
        let E2 = this.fld(x + (E.gx * h) / 2, y + (E.gy * h) / 2);
        let E3 = this.fld(x + (E2.gx * h) / 2, y + (E2.gy * h) / 2);
        let E4 = this.fld(x + E3.gx * h, y + E3.gy * h);
        let dx = ((E.gx + E2.gx * 2 + E3.gx * 2 + E4.gx) * h) / 6;
        let dy = ((E.gy + E2.gy * 2 + E3.gy * 2 + E4.gy) * h) / 6;
        x += dx;
        y += dy;
        dist += Math.sqrt(dx * dx + dy * dy);
        let theta = ((Math.atan2(dy, dx) % (2 * Math.PI)) * 180) / Math.PI;
        let theta2 =
          ((Math.atan2(E.gy * h, E.gx * h) % (2 * Math.PI)) * 180) / Math.PI;
      }
      if (!fieldline.startCharge || dist > fieldline.startCharge.r) {
        let span = SpansIntegerMultiple(lastE.U, E.U, potential_multiple);
        if (span != null) {
          let pnode = { U: span * potential_multiple, E1: lastE, E2: E };
          this.potentialnodes.push(pnode);
        }
      }
      fieldline.points.push({ x: x, y: y });
      lastE = E;
      let collide = this.collisionFind(x, y);
      if (collide && fieldline.dir * collide.q < 0 && nstep > 1) {
        if (collide.nodesUsed.length > collide.n_nodes) {
          return false;
        } else {
          this.collisionDo(collide, x, y);
          fieldline.endCharge = collide;
          fieldline.nstep = nstep;
          return true;
        }
      }
      if (nstep > max_steps) {
        fieldline.endCharge = null;
        fieldline.endAngle = null;
        fieldline.endNodeAngle = null;
        fieldline.nstep = nstep;
        return true;
      }
    }
  }
  fieldLinesFind() {
    this.fieldLines = [];
    this.potentialnodes = [];
    this.equipotential_lines = [];
    let total_charge = 0;
    let max_x = -1e20;
    let min_x = 1e20;
    let max_y = -1e20;
    let min_y = 1e20;
    let max;
    for (let i = 0; i < this.charges.length; i++) {
      let charge = this.charges[i];
      total_charge += charge.q;
      charge.r = 0.12 * Math.sqrt(Math.abs(charge.q));
      charge.n_nodes = Math.round(
        Math.abs(source_lines_per_unit_charge * charge.q)
      );
      charge.nodes = [];
      charge.nodesUsed = [];
      charge.nodesNeeded = [];
      if (charge.x > max_x) max_x = charge.x;
      if (charge.x < min_x) min_x = charge.x;
      if (charge.y > max_y) max_y = charge.y;
      if (charge.y < min_y) min_y = charge.y;
    }
    this.charges.sort(chargesort);
    if (total_charge < 0) this.charges.reverse();
    let escaping_lines = Math.abs(total_charge * source_lines_per_unit_charge);
    for (let i = 0; i < escaping_lines; i++) {
      let r = Math.max(this.xmax, this.ymax) * 10;
      if (isNaN(r)) r = 10;
      let theta = (i * 2 * 3.14159) / escaping_lines;
      let x = r * Math.cos(theta);
      let y = r * Math.sin(theta);
      let fieldline = { startCharge: null };
      if (total_charge > 0) fieldline.dir = -1;
      else fieldline.dir = 1;
      fieldline.start_x = x;
      fieldline.start_y = y;
      fieldline.start = "outside";
      let nodeFinished = this.fieldLineTrace(fieldline);
      if (nodeFinished) {
        this.fieldLines.push(fieldline);
      } else {
      }
    }
    for (let i = 0; i < this.charges.length; i++) {
      let random_seed = 0;
      let charge = this.charges[i];
      this.ctx.fillStyle = "blue";
      while (
        charge.nodesUsed.length < charge.n_nodes &&
        charge.nodes.length < source_lines_per_unit_charge * 5
      ) {
        if (charge.nodes.length > source_lines_per_unit_charge * 4) {
          console.warn("Wow! Tried way too many nodes.", charge.nodes);
        }
        let start_angle = this.nodePositionFind(charge);
        let r = charge.r;
        let fieldline = { startCharge: charge };
        fieldline.start = "charge";
        let nodeFinished = false;
        fieldline.start_x = charge.x + charge.r * Math.cos(start_angle);
        fieldline.start_y = charge.y + charge.r * Math.sin(start_angle);
        fieldline.start_angle = start_angle;
        let dir = 1;
        if (charge.q < 0) dir = -1;
        fieldline.dir = dir;
        nodeFinished = this.fieldLineTrace(fieldline);
        if (nodeFinished) {
          this.fieldLines.push(fieldline);
          charge.nodesUsed.push(start_angle);
        }
      }
    }
    if (this.equiPotQ) {
      this.potentialnodes.sort(function (a, b) {
        return a.U - b.U;
      });
      while (this.potentialnodes.length > 0) {
        let pnode = this.potentialnodes.shift();
        let Utarget = pnode.U;
        let E = this.positionOfUFind(pnode.E1, Utarget, Utolerance);
        let xstart = E.x;
        let ystart = E.y;
        for (let dir = -1; dir < 3; dir += 2) {
          let line = { U: Utarget, points: [{ x: E.x, y: E.y }] };
          let done = false;
          let np = 0;
          while (!done) {
            np++;
            let newx = 0,
              newy = 0;
            if (this.estMode == 1) {
              let h = step_equi * dir;
              newx = E.x + E.gy * h;
              newy = E.y - E.gx * h;
            } else {
              let h = step_equi * 3 * dir;
              let E2 = this.fld(E.x + (E.gy * h) / 2, E.y - (E.gx * h) / 2);
              let E3 = this.fld(E.x + (E2.gy * h) / 2, E.y - (E2.gx * h) / 2);
              let E4 = this.fld(E.x + E3.gy * h, E.y - E3.gx * h);
              newx = E.x + ((E.gy + E2.gy * 2 + E3.gy * 2 + E4.gy) * h) / 6;
              newy = E.y - ((E.gx + E2.gx * 2 + E3.gx * 2 + E4.gx) * h) / 6;
            }
            let next_point = this.fld(newx, newy);
            for (let i = 0; i < this.potentialnodes.length; i++) {
              let othernode = this.potentialnodes[i];
              if (othernode.U == Utarget) {
                if (
                  LineSegmentsIntersect(
                    E,
                    next_point,
                    othernode.E1,
                    othernode.E2
                  )
                ) {
                  this.potentialnodes.splice(i, 1);
                  i--;
                }
              } else break;
            }
            if (
              np > 2 &&
              LineSegmentsIntersect(E, next_point, pnode.E1, pnode.E2)
            ) {
              done = true;
              dir = 3;
            } else if (np > max_equi_step) {
              done = true;
            }
            line.points.push({ x: next_point.x, y: next_point.y });
            E = next_point;
          }
          this.equipotential_lines.push(line);
        }
      }
    }
  }
  TotalEnergy() {
    let tot = 0;
    for (let i = 1; i < this.charges.length; i++) {
      for (let j = 0; j < i; j++) {
        let ci = this.charges[i];
        let cj = this.charges[j];
        let dx = ci.x - cj.x;
        let dy = ci.y - cj.y;
        let r2 = dx * dx + dy * dy;
        let r = Math.sqrt(r2);
        tot += (2 * ci.q * 2 * cj.q) / r;
      }
    }
    return tot;
  }
  draw() {
    my.can.clear();
    this.ctx.save();
    this.equiPotQ = document.getElementById("ctl-do-eqipotential").checked;
    this.canvas_translate = { x: this.can.wd / 2, y: this.can.ht / 2 };
    this.ctx.translate(this.canvas_translate.x, this.canvas_translate.y);
    this.xmin = -this.width_x / 2;
    this.xmax = this.width_x / 2;
    this.ymin = ((-this.width_x / 2) * this.can.ht) / this.can.wd;
    this.ymax = ((this.width_x / 2) * this.can.ht) / this.can.wd;
    this.ctx.strokeStyle = "blue";
    this.ctx.fillStyle = "white";
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.rect(
      -this.canvas_translate.x,
      -this.canvas_translate.y,
      this.can.wd,
      this.can.ht
    );
    this.ctx.stroke();
    this.ctx.fill();
    this.ctx.beginPath();
    let urlparams = "";
    for (let i = 0; i < this.charges.length; i++) {
      if (i == 0) urlparams += "?";
      else urlparams += "&";
      urlparams += "q" + i + "=";
      urlparams +=
        this.charges[i].q +
        "," +
        parseFloat(this.charges[i].x.toFixed(3)) +
        "," +
        parseFloat(this.charges[i].y.toFixed(3));
      if (hide_charge_values) urlparams += "&hideq=1";
      urlparams += "&lines=" + source_lines_per_unit_charge;
    }
    document.getElementById("totalenergy").innerHTML =
      "Total Energy: " + this.TotalEnergy().toFixed(1);
    this.fieldLinesFind();
    this.fieldLinesDraw();
    this.drawCharges();
    if (this.equiPotQ) this.drawEquipotentialLines();
    this.ctx.restore();
  }
  fieldLinesDraw() {
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.fieldLines.length; i++) {
      let line = this.fieldLines[i];
      this.ctx.strokeStyle = "black";
      this.ctx.beginPath();
      this.ctx.lineJoin = "round";
      this.ctx.moveTo(line.start_x * this.scale, line.start_y * this.scale);
      for (let j = 1; j < line.points.length; j++) {
        let p = line.points[j];
        this.ctx.lineTo(p.x * this.scale, p.y * this.scale);
      }
      this.ctx.stroke();
      let n = line.points.length;
      let j = Math.round((n - 1) / 2);
      let x = line.points[j].x;
      let y = line.points[j].y;
      while (x < this.xmin || x > this.xmax || y < this.ymin || y > this.ymax) {
        if (line.start == "outside") j = Math.round(n - (n - j) / 2);
        else j = Math.round(j / 2);
        x = line.points[j].x;
        y = line.points[j].y;
        if (j <= 1 || j >= n - 3) break;
      }
      let dx = line.dir * (line.points[j + 1].x - x);
      let dy = line.dir * (line.points[j + 1].y - y);
      this.ctx.fillStyle = "black";
      this.ctx.beginPath();
      let angle = (Math.atan2(-dy, dx) + TWO_PI) % TWO_PI;
      this.ctx.drawArrow(
        x * this.scale,
        y * this.scale,
        2,
        1,
        20,
        10,
        angle,
        5
      );
      this.ctx.stroke();
      this.ctx.fill();
    }
  }
  drawEquipotentialLines() {
    console.time("drawing potential lines");
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "green";
    this.ctx.lineJoin = "round";
    for (let i = 0; i < this.equipotential_lines.length; i++) {
      let line = this.equipotential_lines[i];
      this.ctx.beginPath();
      for (let j = 0; j < line.points.length; j++) {
        let p = line.points[j];
        if (j == 0) {
          this.ctx.moveTo(p.x * this.scale, p.y * this.scale);
        } else {
          this.ctx.lineTo(p.x * this.scale, p.y * this.scale);
        }
      }
      this.ctx.stroke();
    }
  }
  drawCharges() {
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";
    this.ctx.font = "12pt sans-serif";
    for (let i = 0; i < this.charges.length; i++) {
      let charge = this.charges[i];
      this.ctx.fillStyle = charge.q > 0 ? "red" : "blue";
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = charge.highlight ? 3 : 1;
      let x = charge.x * this.scale;
      let y = charge.y * this.scale;
      let r = charge.r;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r * this.scale, 0, Math.PI * 2, true);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = "white";
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 1;
      let s;
      if (charge.q < 0) s = "-";
      else s = "+";
      s += parseInt(Math.abs(charge.q));
      if (!hide_charge_values) this.ctx.fillText(s, x, y);
    }
  }
  getEventXY(ev) {
    let offset = getAbsolutePosition(this.can.el);
    let x = ev.pageX;
    let y = ev.pageY;
    if (
      ev.type == "touchstart" ||
      ev.type == "touchmove" ||
      ev.type == "touchend"
    ) {
      ev.preventDefault();
      x = ev.originalEvent.touches[0].pageX;
      y = ev.originalEvent.touches[0].pageY;
    }
    x = x - offset.x;
    y = y - offset.y;
    x -= this.canvas_translate.x;
    y -= this.canvas_translate.y;
    return { x: x, y: y };
  }
  mouseDo(ev) {
    let xy = this.getEventXY(ev);
    let x = xy.x / this.scale;
    let y = xy.y / this.scale;
    let update = false;
    if (ev.type === "mousedown" || ev.type === "touchstart") {
      let charge = this.collisionFind(x, y);
      if (charge) {
        this.dragging = true;
        this.charge_dragged = charge;
        charge.highlight = true;
        update = true;
      }
    }
    if (ev.type === "mousemove" || ev.type === "touchmove") {
      my.can2.clear();
      if (this.dragging) {
        this.charge_dragged.x = x;
        this.charge_dragged.y = y;
        update = true;
      } else {
        let f = this.fld(x, y);
        let charge = this.collisionFind(x, y, 0.02);
        if (charge) {
        } else {
          let mid = {
            x: x * this.scale + this.canvas_translate.x,
            y: y * this.scale + this.canvas_translate.y,
          };
          let inc = { x: f.Ex * 5, y: f.Ey * 5 };
          let angle = (Math.atan2(-inc.y, inc.x) + TWO_PI) % TWO_PI;
          my.can2.clear();
          let g = my.can2.g;
          g.fillStyle = "red";
          g.beginPath();
          g.arc(mid.x, mid.y, 4, 0, TWO_PI);
          g.fill();
          g.lineWidth = 1.5;
          g.strokeStyle = "red";
          g.beginPath();
          g.moveTo(mid.x - inc.x, mid.y - inc.y);
          g.lineTo(mid.x + inc.x, mid.y + inc.y);
          g.drawArrow(mid.x + inc.x, mid.y + inc.y, 2, 1, 20, 10, angle, 5);
          g.stroke();
          g.fill();
        }
      }
    }
    if (ev.type === "mouseup" || ev.type === "touchend") {
      if (this.charge_dragged) this.charge_dragged.highlight = false;
      this.charge_dragged = null;
      this.dragging = false;
      update = true;
    }
    if (ev.type === "mouseout") {
      if (this.charge_dragged) {
        let which = 0;
        for (let i = 0; i < this.charges.length; i++)
          if (this.charge_dragged == this.charges[i]) which = i;
        this.charges.splice(which, 1);
        this.charge_dragged = false;
        this.dragging = false;
        update = true;
      }
    }
    if (update) this.draw();
  }
  chargeAdd(q) {
    console.log("chargeAdd", q);
    let x = my.addNext.x;
    let y = my.addNext.y;
    my.addNext.x += 0.3;
    if (my.addNext.x > 1.6) my.addNext.x = -1.5;
    let charge = { q: q, x: x, y: y, r: 0.12 * Math.sqrt(Math.abs(q)) };
    this.charges.push(charge);
    console.log("this.charges", this.charges);
    this.draw();
  }
  chargeAddRandom(ev) {
    console.log(ev);
    let q = parseFloat(ev.currentTarget.getAttribute("q"));
    console.log(q);
    this.xmin = -this.width_x / 2;
    this.xmax = this.width_x / 2;
    this.ymin = ((-this.width_x / 2) * this.canvas.height) / this.canvas.width;
    this.ymax = ((this.width_x / 2) * this.canvas.height) / this.canvas.width;
    let x = ((Math.random() * 1.8 - 0.9) * (this.xmax - this.xmin)) / 2;
    let y = ((Math.random() * 1.8 - 0.9) * (this.ymax - this.ymin)) / 2;
    this.charges.push({ q: q, x: x, y: y, r: 0.12 * Math.abs(q) });
    this.draw();
  }
  printHQ() {
    let saveCanvas = this.canvas;
    let saveCtx = this.ctx;
    let saveWidth = this.width;
    let saveHeight = this.height;
    let gPrintScale = 1;
    let canvas = document.createElement("canvas");
    this.canvas = canvas;
    canvas.width = saveWidth * gPrintScale;
    canvas.height = saveHeight * gPrintScale;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.scale(gPrintScale, gPrintScale);
    this.draw();
    let gPrintBuffer = this.canvas.toDataURL("image/png");
    this.canvas = saveCanvas;
    this.ctx = saveCtx;
  }
}
function chargesort(a, b) {
  let cmp = a.q - b.q;
  if (cmp == 0) cmp = a.y - b.y;
  return cmp;
}
function SpansIntegerMultiple(a, b, r) {
  let da = Math.floor(a / r);
  let db = Math.floor(b / r);
  if (da == db) return null;
  return Math.max(da, db);
}
function PointTripletOrientation(p, q, r) {
  let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val == 0) return 0;
  return val > 0 ? 1 : 2;
}
function PointOnSegment(p, q, r) {
  if (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  )
    return true;
  return false;
}
function LineSegmentsIntersect(p1, q1, p2, q2) {
  let o1 = PointTripletOrientation(p1, q1, p2);
  let o2 = PointTripletOrientation(p1, q1, q2);
  let o3 = PointTripletOrientation(p1, p2, q2);
  let o4 = PointTripletOrientation(q1, p2, q2);
  let d2 = (q2.x - p1.x) * (q2.x - p1.x) + (q2.y - p1.y) * (q2.y - p1.y);
  if (o1 != o2 && o3 != o4) return true;
  return false;
}
function getAbsolutePosition(element) {
  let r = { x: element.offsetLeft, y: element.offsetTop };
  if (element.offsetParent) {
    let tmp = getAbsolutePosition(element.offsetParent);
    r.x += tmp.x;
    r.y += tmp.y;
  }
  return r;
}
function canvasSave(typ) {
  typ = typ == undefined ? "png" : typ;
  if (typ == "jpg") typ = "jpeg";
  let can = my.can.el;
  let dataUrl = can.toDataURL("image/" + typ);
  let win = window.open();
  let s = '<img src="' + dataUrl + '">';
  win.document.write(s);
  win.document.location = "#";
}
CanvasRenderingContext2D.prototype.drawArrow = function (
  x0,
  y0,
  totLen,
  shaftHt,
  headLen,
  headHt,
  angle,
  sweep,
  invertQ
) {
  let g = this;
  let pts = [
    [0, 0],
    [-headLen, -headHt / 2],
    [-headLen + sweep, -shaftHt / 2],
    [-totLen, -shaftHt / 2],
    [-totLen, shaftHt / 2],
    [-headLen + sweep, shaftHt / 2],
    [-headLen, headHt / 2],
    [0, 0],
  ];
  for (let i in pts) {
    let pt = pts[i];
    pt[0] += headLen / 2;
  }
  if (invertQ) {
    pts.push(
      [0, -headHt / 2],
      [-totLen, -headHt / 2],
      [-totLen, headHt / 2],
      [0, headHt / 2]
    );
  }
  for (let i = 0; i < pts.length; i++) {
    let cosa = Math.cos(-angle);
    let sina = Math.sin(-angle);
    let xPos = pts[i][0] * cosa + pts[i][1] * sina;
    let yPos = pts[i][0] * sina - pts[i][1] * cosa;
    if (i == 0) {
      g.moveTo(x0 + xPos, y0 + yPos);
    } else {
      g.lineTo(x0 + xPos, y0 + yPos);
    }
  }
};
class Can {
  constructor(id, wd, ht, ratio) {
    this.ratio = ratio;
    this.el = typeof id == "string" ? document.getElementById(id) : id;
    this.g = this.el.getContext("2d");
    this.resize(wd, ht);
    return this;
  }
  resize(wd, ht) {
    this.wd = wd;
    this.ht = ht;
    this.el.width = wd * this.ratio;
    this.el.style.width = wd + "px";
    this.el.height = ht * this.ratio;
    this.el.style.height = ht + "px";
    this.g.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
  }
  clear() {
    this.g.clearRect(0, 0, this.wd, this.ht);
  }
  mousePos(ev) {
    let bRect = this.el.getBoundingClientRect();
    let x =
      (ev.clientX - bRect.left) * (this.el.width / this.ratio / bRect.width);
    let y =
      (ev.clientY - bRect.top) * (this.el.height / this.ratio / bRect.height);
    return { x: x, y: y };
  }
}
function docInsert(s) {
  let div = document.createElement("div");
  div.innerHTML = s;
  let script = document.currentScript;
  script.parentElement.insertBefore(div, script);
}
function wrap(
  {
    id = "",
    cls = "",
    pos = "rel",
    style = "",
    txt = "",
    tag = "div",
    lbl = "",
    fn = "",
    opts = [],
  },
  ...mores
) {
  let s = "";
  s += "\n";
  txt += mores.join("");
  let noProp = "event.stopPropagation(); ";
  let tags = {
    btn: {
      stt:
        "<button " + (fn.length > 0 ? ' onclick="' + noProp + fn + '" ' : ""),
      cls: "btn",
      fin: ">" + txt + "</button>",
    },
    can: { stt: "<canvas ", cls: "", fin: "></canvas>" },
    div: {
      stt: "<div " + (fn.length > 0 ? ' onclick="' + fn + '" ' : ""),
      cls: "",
      fin: " >" + txt + "</div>",
    },
    edit: {
      stt: '<textarea onkeyup="' + fn + '" onchange="' + fn + '"',
      cls: "",
      fin: " >" + txt + "</textarea>",
    },
    inp: {
      stt:
        '<input value="' +
        txt +
        '"' +
        (fn.length > 0 ? '  oninput="' + fn + '" onchange="' + fn + '"' : ""),
      cls: "input",
      fin: ">" + (lbl.length > 0 ? "</label>" : ""),
    },
    out: {
      stt: "<span ",
      cls: "output",
      fin: " >" + txt + "</span>" + (lbl.length > 0 ? "</label>" : ""),
    },
    radio: { stt: "<div ", cls: "radio", fin: ">\n" },
    sel: {
      stt: "<select " + (fn.length > 0 ? ' onchange="' + fn + '"' : ""),
      cls: "select",
      fin: ">\n",
    },
    sld: {
      stt:
        '<input type="range" ' +
        txt +
        ' oninput="' +
        noProp +
        fn +
        '" onchange="' +
        noProp +
        fn +
        '"',
      cls: "select",
      fin: ">" + (lbl.length > 0 ? "</label>" : ""),
    },
  };
  let type = tags[tag];
  if (lbl.length > 0) s += '<label class="label">' + lbl + " ";
  s += type.stt;
  if (cls.length == 0) cls = type.cls;
  if (tag == "div") style += fn.length > 0 ? " cursor:pointer;" : "";
  if (id.length > 0) s += ' id="' + id + '"';
  if (cls.length > 0) s += ' class="' + cls + '"';
  if (pos == "dib")
    s += ' style="position:relative; display:inline-block;' + style + '"';
  if (pos == "rel") s += ' style="position:relative; ' + style + '"';
  if (pos == "abs") s += ' style="position:absolute; ' + style + '"';
  s += type.fin;
  if (tag == "radio") {
    for (let i = 0; i < opts.length; i++) {
      let chk = "";
      if (i == 0) chk = "checked";
      let idi = id + i;
      let lbl = opts[i];
      s +=
        '<input id="' +
        idi +
        '" type="radio" name="' +
        id +
        '" value="' +
        lbl.name +
        '" onclick="' +
        fn +
        "(" +
        i +
        ');" ' +
        chk +
        " >";
      s += '<label for="' + idi + '">' + lbl.name + " </label>";
    }
    s += "</div>";
  }
  if (tag == "sel") {
    for (let i = 0; i < opts.length; i++) {
      let opt = opts[i];
      let idStr = id + i;
      let chkStr = opt.name == txt ? " selected " : "";
      let descr = opt.hasOwnProperty("descr") ? opt.descr : opt.name;
      s +=
        '<option id="' +
        idStr +
        '" value="' +
        opt.name +
        '"' +
        chkStr +
        ">" +
        descr +
        "</option>\n";
    }
    s += "</select>";
    if (lbl.length > 0) s += "</label>";
  }
  s += "\n";
  return s.trim();
}
init();
