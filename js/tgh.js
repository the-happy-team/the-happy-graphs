let mImg;

const points = {
  length: 64,
  h: { length: 64}
}

const Z_MAX = 500;
const NOISEF = 0.06;

let gridStep;
let maxDim;

let easycam;

const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
};

function preload() {
  mImg = loadImage('assets/tgh.jpg');
}

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.values['neutral'].reverse();
}

function setup() {
  noiseSeed(101011);
  createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes('antialias', true);
  smooth();
  pixelDensity(2);
  randomSeed(1010);

  easycam = new Dw.EasyCam(this._renderer);

  gridStep = Math.max(height / points.length, width / points.h.length);
  maxDim = Math.max(gridStep * points.length, gridStep * points.h.length);

  CAM_TRANS.x = -0.5 * gridStep * points.h.length;
  CAM_TRANS.y = -0.5 * gridStep * points.length;
  CAM_TRANS.z = -500;
}

function draw() {
  background(16);
  translate(CAM_TRANS.x, CAM_TRANS.y, CAM_TRANS.z);

  pointLight(255, 255, 255, 0, 0, 1000);
  specularMaterial(255, 255, 255);
  shininess(100);
  textureMode(NORMAL);
  texture(mImg);

  for(let h = 0; h < points.length - 1; h++) {
    const y0 = gridStep * (h + 0);
    const y1 = gridStep * (h + 1);

    const y0n = y0 / maxDim;
    const y1n = y1 / maxDim;

    for(let w = 0; w < points.h.length - 1; w++) {
      const x0 = gridStep * (w + 0);
      const x1 = gridStep * (w + 1);

      const x0n = x0 / maxDim;
      const x1n = x1 / maxDim;

      push();
      beginShape();
      vertex(x0, y0, Z_MAX * noise(.5 * NOISEF * (h + 0), NOISEF * (w + 0)), x0n, y0n);
      vertex(x1, y0, Z_MAX * noise(.5 * NOISEF * (h + 0), NOISEF * (w + 1)), x1n, y0n);
      vertex(x1, y1, Z_MAX * noise(.5 * NOISEF * (h + 1), NOISEF * (w + 1)), x1n, y1n);
      vertex(x0, y1, Z_MAX * noise(.5 * NOISEF * (h + 1), NOISEF * (w + 0)), x0n, y1n);
      endShape(CLOSE);
      pop();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0,0,windowWidth, windowHeight]);
}
