let jsonA;
let jsonC;
const points = [];
const pointsR = [];

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

function averageValues(vals) {
  
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

      const thisZ = map(mVals[vi], minVal, maxVal, 0, 200);
      let z = Math.max(thisZ, 0.666 * lastZ);
      lastZ = z;

      const thisZr = map(mVals[viR], minVal, maxVal, 0, 200);
      let zR = Math.max(thisZr, 0.666 * lastZR);
      lastZR = zR;

      if (e === 'neutral') {
        z = 200 - z;
        zR = 200 - zR;
      }
      if(z > 40 || zR > 40) {
        mPs.push(z);
        mPsR.push(zR);
      }
    }

    points.push(mPs);
    pointsR.push(mPsR.reverse());
    if (mPs.length > maxPoints) maxPoints = mPs.length;
  }

  for(let p = 0; p < points.length; p++) {
    for(let x = points[p].length; x < maxPoints; x++) {
      points[p].push(0);
      pointsR[p].push(0);
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

      line(x0, y0, Math.max(points[h][w], pointsR[h][w]),
           x0, y1, Math.max(points[h-1][w], pointsR[h-1][w]));

      line(x0, y0, Math.max(points[h][w], pointsR[h][w]),
           x1, y0, Math.max(points[h][w-1], pointsR[h][w-1]));
    }
  }

  for(let h = 1; h < points.length; h++) {
    const y0 = gridStep * (h - 0);
    const y1 = gridStep * (h - 1);
    line(0, y0, Math.max(points[h][0], pointsR[h][0]),
         0, y1, Math.max(points[h-1][0], pointsR[h-1][0]));
  }

  for(let w = 1; w < points[0].length; w++) {
    const x0 = gridStep * (w - 0);
    const x1 = gridStep * (w - 1);
    line(x0, 0, Math.max(points[0][w], pointsR[0][w]),
         x1, 0, Math.max(points[0][w-1], pointsR[0][w-1]));
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
