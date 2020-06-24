let jsonA;
let jsonC;
let mImg;

let jsonALoaded = false;
let jsonCLoaded = false;

const Z_MAX = 500;
const V_FILTER = 0.005;

const points = [];
let gridStep;
let maxDim;

let easycam;
let COLORS = false;
let TEXTURE = false;
let TILE = false;

const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
};

function preload() {
  jsonA = loadJSON('assets/values-A.json');
  jsonC = loadJSON('assets/values-C.json');
  //mImg = loadImage('assets/texture.jpg');
}

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.values['neutral'].forEach((v, i, arr) => arr[i] = (1.0 - v));
  mj.values['neutral'].reverse();

  for(let e of jsonA.header) {
    jsonA.values[`${e}_f`] = [];
    jsonC.values[`${e}_f`] = [];
  }

  for(let p = 0; p < jsonA.values['happy'].length && p < jsonC.values['happy'].length; p++) {
    let aHasVal = false;
    let cHasVal = false;

    for(let e of jsonA.header) {
      aHasVal |= (jsonA.values[e][p] > V_FILTER);
      cHasVal |= (jsonC.values[e][p] > V_FILTER);
    }

    if (aHasVal || cHasVal) {
      for(let e of jsonA.header) {
        jsonA.values[`${e}_f`].push(jsonA.values[e][p]);
        jsonC.values[`${e}_f`].push(jsonC.values[e][p]);
      }
    }
  }

  for(let e of jsonA.header) {
    jsonA.values[`${e}`] = jsonA.values[`${e}_f`];
    jsonC.values[`${e}`] = jsonC.values[`${e}_f`];
    delete jsonA.values[`${e}_f`];
    delete jsonC.values[`${e}_f`];
  }
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
    let z = Math.max(thisZ, random(0.3, 0.5) * lastZ);
    lastZ = z;

    const thisZR = map(mVals[iR], minVal, maxVal, 0, Z_MAX);
    let zR = Math.max(thisZR, random(0.3, 0.5) * lastZR);
    lastZR = zR;

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
    for(let ei = 0; ei < jsonA.header.length; ei++) {
      const e = jsonA.header[ei];
      points[2 * ei + 0].push(jsonA.values[`${e}`][p]);
      points[2 * ei + 1].push(jsonC.values[`${e}`][p]);
    }
  }

  gridStep = Math.max(height / points.length, width / points[0].length);
  maxDim = Math.max(gridStep * points.length, gridStep * points[0].length);
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
  fill(16);

  translate(CAM_TRANS.x, CAM_TRANS.y, CAM_TRANS.z);

  if (COLORS) {
    fill(255);
    pointLight(250, 0, 0,   -CAM_TRANS.x/2, 0, 50);
    pointLight(0, 250, 0,   -CAM_TRANS.x, 0,   50);
    pointLight(0, 0, 250,   0, 0,              50);
    pointLight(250, 250, 0, CAM_TRANS.x, 0,    50);
    pointLight(250, 0, 250, CAM_TRANS.x/2, 0,  50);
  } else if (TEXTURE) {
    texture(mImg);
    textureMode(NORMAL);
  } else {
    fill(64);
    stroke(255);
    ambientLight(200,200,200);
  }

  for(let h = 0; h < points.length - 1; h++) {
    const y0 = gridStep * (h + 0);
    const y1 = gridStep * (h + 1);

    const y0n = y0 / maxDim;
    const y1n = y1 / maxDim;

    for(let w = 0; w < points[h].length - 1; w++) {
      const x0 = gridStep * (w + 0);
      const x1 = gridStep * (w + 1);

      const x0n = x0 / maxDim;
      const x1n = x1 / maxDim;

      push();
      beginShape();
      if (!TILE && !TEXTURE) {
        vertex(x0, y0, points[h][w]);
        vertex(x1, y0, points[h][w + 1]);
        vertex(x1, y1, points[h + 1][w + 1]);
        vertex(x0, y1, points[h + 1][w]);
      }
      else if (TILE) {
        vertex(x0, y0, points[h][w], 0, 0);
        vertex(x1, y0, points[h][w + 1], 1, 0);
        vertex(x1, y1, points[h + 1][w + 1], 1, 1);
        vertex(x0, y1, points[h + 1][w], 0, 1);
      } else if (TEXTURE) {
        vertex(x0, y0, points[h][w], x0n, y0n);
        vertex(x1, y0, points[h][w + 1], x1n, y0n);
        vertex(x1, y1, points[h + 1][w + 1], x1n, y1n);
        vertex(x0, y1, points[h + 1][w], x0n, y1n);
      }
      endShape(CLOSE);
      pop();
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
        event.target.classList.add('file-input-disable');
      } else {
        jsonC = JSON.parse(readerEvent.target.result);
        jsonCLoaded = true;
        event.target.classList.add('file-input-disable');
      }

      if(jsonALoaded && jsonCLoaded) {
        jsonALoaded = false;
        jsonCLoaded = false;
        document.getElementById('my-a-file').classList.remove('file-input-disable');
        document.getElementById('my-c-file').classList.remove('file-input-disable');

        readNewJsonFiles();
      }
      if (event.target) event.target.value = '';
    }
    reader.readAsText(file);
  });

  $('#my-color-box').click(() => {
    COLORS = $('#my-color-box').is(":checked");
  });
});
