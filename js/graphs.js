let jsonA;
let jsonC;

let jsonALoaded = false;
let jsonCLoaded = false;

const Z_MAX = 500;
const Z_FILTER = 50;

const points = [];
let gridStep;

let easycam;
const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
};

function preload() {
  jsonA = loadJSON('assets/values-A.json');
  jsonC = loadJSON('assets/values-C.json');
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
    let z = Math.max(thisZ, random(0.4, 0.6) * lastZ);
    lastZ = z;

    const thisZR = map(mVals[iR], minVal, maxVal, 0, Z_MAX);
    let zR = Math.max(thisZR, random(0.4, 0.6) * lastZR);
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

function readNewJsonFiles() {
  points.length = 0;
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

  gridStep = Math.max(height / points.length, width / points[0].length);
  CAM_TRANS.x = -0.5 * gridStep * points[0].length;
  CAM_TRANS.y = -0.5 * gridStep * points.length;
  CAM_TRANS.z = -500;
}

function setup() { 
  createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes('antialias', true);
  smooth();
  pixelDensity(2);
  randomSeed(1010);

  easycam = new Dw.EasyCam(this._renderer);

  readNewJsonFiles();
}

function draw() {
  background(0);
  strokeWeight(3);
  stroke(255);
  fill(255);

  translate(CAM_TRANS.x, CAM_TRANS.y, CAM_TRANS.z);

  pointLight(250, 0, 0,   -CAM_TRANS.x/2, 0, -300);
  pointLight(0, 250, 0,   -CAM_TRANS.x, 0,   -300);
  pointLight(0, 0, 250,   0, 0,              -300);
  pointLight(250, 250, 0, CAM_TRANS.x, 0,    -300);
  pointLight(250, 0, 250, CAM_TRANS.x/2, 0,  -300);

  for(let h = 0; h < points.length - 1; h++) {
    const y0 = gridStep * (h + 0);
    const y1 = gridStep * (h + 1);

    for(let w = 0; w < points[h].length - 1; w++) {
      const x0 = gridStep * (w + 0);
      const x1 = gridStep * (w + 1);

      beginShape();
      vertex(x0, y0, points[h][w]);
      vertex(x1, y0, points[h][w + 1]);
      vertex(x1, y1, points[h + 1][w + 1]);
      vertex(x0, y1, points[h + 1][w]);
      endShape(CLOSE);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0,0,windowWidth, windowHeight]);
}

$(() => {
  $(".file-input").change((event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      if(event.target.id === 'my-a-file') {
        jsonA = JSON.parse(readerEvent.target.result);
        jsonALoaded = true;
      } else {
        jsonC = JSON.parse(readerEvent.target.result);
        jsonCLoaded = true;
      }

      if(jsonALoaded && jsonCLoaded) {
        jsonALoaded = false;
        jsonCLoaded = false;
        readNewJsonFiles();
      }
      if (event.target) event.target.value = '';
    }
    reader.readAsText(file);
  });
});
