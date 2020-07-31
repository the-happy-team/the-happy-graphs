// modified version of: https://github.com/freshfork/p5.SimpleCam/

class Damp {
  constructor(a, b, c, d) {
    this.val_reset = a,
      this.val_start = a,
      this.val_now = a,
      this.val_end = a,
      this.limit = d,
      this.speed = b,
      this.damp = c,
      this.state = null
  }
  active() {
    return null !== this.state
  }
  start(a) {
    this.state = a, this.val_start = this.val_now
  }
  drag(a) {
    if (this.active()) {
      var b = this.state - a;
      this.val_end = this.val_start + b * this.speed,
        this.limit && (this.val_end = Math.min(Math.max(this.val_end, this.limit[0]), this.limit[1]))
    }
  }
  end() {
    this.state = null
  }
  update() {
    return this.val_now = this.val_end * this.damp + this.val_now * (1 - this.damp), this.val_now
  }
  reset(a) {
    this.val_end = a === void 0 ? this.val_reset : a
  }
}

window.document.ontouchmove = null;

class SimpleCam {
  constructor(w, inst) {
    this.parent = inst;
    this.active = !0;
    this.dx = new Damp(0, -1, 0.07, [-400, 400]);
    this.dy = new Damp(0, -1, 0.07, [-400, 400]);
    this.rx = new Damp(0, 0.01, 0.07, [-Math.PI, Math.PI]);
    this.ry = new Damp(0, 0.01, 0.07, [-Math.PI, Math.PI]);
    this.zoom = new Damp(1e3, -10, 0.07, [400, 1e4]);
    this.mouseDragging = 0;

    const dblClickWindow = this.parent.canvas || w;

    var b = this;
    w.addEventListener("wheel", function(a) {
      if(b.active){
        b.zoom.start(-a.deltaY);
        b.zoom.drag(a.deltaY * 10);
        b.zoom.end();
      }
    });
    dblClickWindow.addEventListener("dblclick", function() {
      b.active && b.reset()
    });
    w.addEventListener("mousemove", function(a) {
      b.active && b.mouseDragging && b.dragP();
    });
    w.addEventListener("mousedown", function(a) {
      if(b.active) {
        if(0 === a.button) b.startOrbit();
        else if(1 === a.button) {b.startPan(); b.mouseDragging = !0; a.preventDefault();}
        else if(2 === a.button) {b.startZoom(); b.mouseDragging = !0;}
      }
    });
    w.addEventListener("mouseup", function(a) {
      0 === a.button && b.endOrbit(),
        1 === a.button && b.endPan(), b.mouseDragging = 0,
        2 === a.button && b.endZoom(), b.mouseDragging = 0;
    });
    w.addEventListener("touchstart", function(a) {
      if(b.active) {
        1 === a.touches.length && b.startOrbitT(a.touches),
          2 === a.touches.length && b.startZoomT(a.touches)
      }
    }, false);
    w.addEventListener("touchmove", function(a) {
      b.active && 1 === a.touches.length && b.dragT(a.touches)
      /*, 2===a.touches.length&&b.dragZ(a.touches)  */
    }, false);
    w.addEventListener("touchend", function(a) {
      b.endOrbit(), b.endZoom()
    }, false);
    inst.registerMethod("pre", function() {
      b.active && (b.drag(), b.update())
    });
  }
  startPan() {
    this.dx.start(this.parent.mouseX);
    this.dy.start(this.parent.mouseY);
  }
  startOrbit() {
    this.rx.start(this.parent.mouseY), this.ry.start(this.parent.mouseX)
  }
  startOrbitT(t) {
    this.rx.start(t[0].clientY), this.ry.start(t[0].clientX)
  }
  startZoom() {
    this.zoom.start(this.parent.mouseY)
  }
  startZoomT(t) {
    this.endOrbit(), this.endZoom(), this.zoom.start(Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY))
  }
  drag() {
    this.rx.drag(this.parent.mouseY), this.ry.drag(this.parent.mouseX), this.mouseDragging && this.zoom.drag(this.parent.mouseY);
  }
  dragT(t) {
    this.rx.drag(t[0].clientY), this.ry.drag(t[0].clientX)
  }
  dragZ(t) {
    this.zoom.drag(this.parent.width - Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY))
  }
  dragP() {
    this.dx.drag(this.parent.mouseX), this.dy.drag(this.parent.mouseY)
  }
  endOrbit() {
    this.rx.end(), this.ry.end()
  }
  endPan() {
    this.dx.end(), this.dy.end()
  }
  endZoom() {
    this.zoom.end()
  }
  activate(a) {
    this.active = a
  }
  reset() {
    this.dx.reset(), this.dy.reset(), this.rx.reset(), this.ry.reset(), this.zoom.reset()
  }
  update() {
    this.dx.update(), this.dy.update(), this.rx.update(), this.ry.update(), this.zoom.update()
  }
  apply(a) {
    a = a || this.parent, a.translate(this.dx.val_now, this.dy.val_now, -this.zoom.val_now), a.rotateX(this.rx.val_now), a.rotateZ(this.ry.val_now)
  }
}
SimpleCam.version = "1.1.0";
document.oncontextmenu = () => false;
p5.prototype.createSimpleCam = function() {
  return new SimpleCam(window, this);
}
