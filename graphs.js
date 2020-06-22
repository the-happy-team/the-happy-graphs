let jsonA;
let jsonC;

const Z_MAX = 500;
const Z_FILTER = 0;

const points = [];

const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
};

const CAM_ROT = {
  x: 0,
  y: 0,
  z: 0
};

const CAM_ZOOM = {
  
};

function preload() {
  jsonA = loadJSON('assets/__values-A.json');
  jsonC = loadJSON('assets/__values-C.json');
}

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.values['neutral'].reverse();
}

function smoothEmotionValues(mj, emo) {
  const mVals = mj.values[emo];
  const minVal = mj.minVals[emo];
  const maxVal = mj.maxVals[emo];

  const points = [];
  const pointsR = [];

  let lastZ = 0;
  let lastZR = 0;

  for(let i = 0; i < mVals.length; i++) {
    const iR = mVals.length - 1 - i;

    const thisZ = map(mVals[i], minVal, maxVal, 0, Z_MAX);
    let z = Math.max(thisZ, 0.7 * lastZ);
    lastZ = z;

    const thisZR = map(mVals[iR], minVal, maxVal, 0, Z_MAX);
    let zR = Math.max(thisZR, 0.7 * lastZR);
    lastZR = zR;

    if (emo === 'neutral') {
      z = Z_MAX - z;
      zR = Z_MAX - zR;
    }
    points.push(z);
    pointsR.push(zR);
  }
  pointsR.reverse();

  for(let i = 0; i < mVals.length; i++) {
    mVals[i] = Math.max(points[i], pointsR[i]);
  }
}

function setup() { 
  const cc = document.getElementById('canvas-container');
  const mCanvas = createCanvas(cc.offsetWidth, cc.offsetHeight, WEBGL);
  mCanvas.parent('canvas-container');
  mCanvas.id('my-canvas');

  smooth();
  pixelDensity(2);
  frameRate(10);
  //noLoop();

  CAM_TRANS.x = -0.66 * width;
  CAM_TRANS.y = -0.22 * height;
  CAM_TRANS.z = -500;

  CAM_ROT.x = 0.8;
  CAM_ROT.y = 0.2;
  CAM_ROT.z = -1.1;

  preProcessJson(jsonA);
  preProcessJson(jsonC);



  for(let e of jsonA.header) {
    smoothEmotionValues(jsonA, e);
    smoothEmotionValues(jsonC, e);
    points.push([]);
    points.push([]);
  }

  for(let p = 0; p < jsonA.values['happy'].length && p < jsonC.values['happy'].length; p++) {
    let aHasVal = false;
    let cHasVal = false;

    for(let e of jsonA.header) {
      aHasVal |= (jsonA.values[e][p] > Z_FILTER);
      cHasVal |= (jsonC.values[e][p] > Z_FILTER);
    }

    if (aHasVal || cHasVal) {
      const emos = jsonA.header;
      for(let ei = 0; ei < emos.length; ei++) {
        points[2 * ei + 0].push(jsonA.values[emos[ei]][p]);
        points[2 * ei + 1].push(jsonC.values[emos[ei]][p]);
      }
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

  for(let h = 0; h < points.length; h++) {
    const y0 = gridStep * (h - 0);
    const y1 = gridStep * (h - 1);

    for(let w = 0; w < points[h].length; w++) {
      const x0 = gridStep * (w - 0);
      const x1 = gridStep * (w - 1);

      if (h > 0) {
        line(x0, y0, points[h][w], x0, y1, points[h-1][w]);
      }
      if (w > 0) {
        line(x0, y0, points[h][w], x1, y0, points[h][w-1]);
      }
    }
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
