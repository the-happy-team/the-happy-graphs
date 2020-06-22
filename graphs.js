let jsonA;
let jsonC;

const MAX_Z = 200;

const points = [];

const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
}

const CAM_ROT = {
  x: 0,
  y: 0,
  z: 0
}

function preload() {
  jsonA = loadJSON('../assets/__values-A.json');
  jsonC = loadJSON('../assets/__values-C.json');
}

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.values['neutral'].reverse();
}

function setup() { 
  const cc = document.getElementById('canvas-container');
  const mCanvas = createCanvas(cc.offsetWidth, cc.offsetHeight, WEBGL);
  mCanvas.parent('canvas-container');
  mCanvas.id('my-canvas');

  smooth();
  pixelDensity(2);
  frameRate(10);

  CAM_TRANS.x = -0.66 * width;
  CAM_TRANS.y = -0.22 * height;
  CAM_TRANS.z = -500;

  CAM_ROT.x = 0.8;
  CAM_ROT.y = 0.2;
  CAM_ROT.z = -1.1;

  preProcessJson(jsonA);

  let maxPoints = 0;

  for(let ei = 0; ei < jsonA.header.length; ei++) {
    const e = jsonA.header[ei];
    const mVals = jsonA.values[e];
    const minVal = jsonA.minVals[e];
    const maxVal = jsonA.maxVals[e];
    const mPs = [];
    const mPsR = [];

    let lastZ = 0;
    let lastZR = 0;

    for(let vi = 0; vi < mVals.length; vi++) {
      const viR = mVals.length - 1 - vi;

      const x = map(vi, 0, mVals.length - 1, 0, width);
      const y = map(ei, 0, jsonA.header.length - 1, 0, height);

      const thisZ = map(mVals[vi], minVal, maxVal, 0, MAX_Z);
      let z = Math.max(thisZ, 0.7 * lastZ);
      lastZ = z;

      const thisZR = map(mVals[viR], minVal, maxVal, 0, MAX_Z);
      let zR = Math.max(thisZR, 0.7 * lastZR);
      lastZR = zR;

      if (e === 'neutral') {
        z = MAX_Z - z;
        zR = MAX_Z - zR;
      }
      if (z > 4 || zR > 4) {
        mPs.push(z);
        mPsR.push(zR);
      }
    }

    mPsR.reverse();
    for(let i = 0; i < mPs.length; i++) {
      mPs[i] = Math.max(mPs[i], mPsR[i]);
    }
    points.push(mPs);

    if (mPs.length > maxPoints) maxPoints = mPs.length;
  }

  for(let p = 0; p < points.length; p++) {
    for(let x = points[p].length; x < maxPoints; x++) {
      points[p].push(0);
    }
  }
}

function draw() {
  smooth();
  pixelDensity(2);
  background(0);
  strokeWeight(3);
  stroke(255);

  push();
  translate(CAM_TRANS.x, CAM_TRANS.y, CAM_TRANS.z);
  rotateX(CAM_ROT.x);
  rotateY(CAM_ROT.y);
  rotateZ(CAM_ROT.z);

  const gridStep = Math.max(height / points.length, width / points[0].length);

  for(let h = 1; h < points.length; h++) {
    const y0 = gridStep * (h - 0);
    const y1 = gridStep * (h - 1);

    for(let w = 1; w < points[h].length; w++) {
      const x0 = gridStep * (w - 0);
      const x1 = gridStep * (w - 1);

      line(x0, y0, points[h][w], x0, y1, points[h-1][w]);
      line(x0, y0, points[h][w], x1, y0, points[h][w-1]);
    }
  }

  for(let h = 1; h < points.length; h++) {
    const y0 = gridStep * (h - 0);
    const y1 = gridStep * (h - 1);
    line(0, y0, points[h][0], 0, y1, points[h-1][0]);
  }

  for(let w = 1; w < points[0].length; w++) {
    const x0 = gridStep * (w - 0);
    const x1 = gridStep * (w - 1);
    line(x0, 0, points[0][w], x1, 0, points[0][w-1]);
  }
  pop();
}

const click = {
  x:0,
  y:0
}

function mousePressed() {
  click.x = mouseX;
  click.y = mouseY;
}

function mouseDragged() {
  const dx = mouseX - click.x;
  const dy = mouseY - click.y;
  CAM_TRANS.x += dx/10;
  CAM_TRANS.y += dy/10;
}
