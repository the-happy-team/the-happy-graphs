let jsonA;
let jsonC;
let mImg;
let m2dGraph;

let jsonALoaded = false;
let jsonCLoaded = false;

const Z_MAX = 500;
const V_FILTER = 0.005;

const points = [];
let gridStep;
let maxDim;

let easycam;
let menuHeight;
const m2dYpadding = 5;

const DISPLAY = {
  LIGHTS: false,
  TEXTURE: false,
  TILE: false
};

let COLORS = false;
let TEXTURE = false;
let TILE = false;
let SHOW2D = false;

const CAM_TRANS = {
  x: 0,
  y: 0,
  z: 0
};

const CAM_INIT_STATE = {
  distance : 2000,
  center   : [0, 0, 0],
  rotation : [Math.sqrt(2) / 2, -Math.sqrt(3) / 2, 0, 0]
};

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.header.push(mj.header.splice(mj.header.indexOf('neutral'), 1)[0]);
  //mj.values['neutral'].forEach((v, i, arr) => arr[i] = (1.0 - v));
  //mj.values['neutral'].reverse();

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

    const thisZ = p53D.map(mVals[i], minVal, maxVal, 0, Z_MAX);
    let z = Math.max(thisZ, p53D.random(0.3, 0.5) * lastZ);
    lastZ = z;

    const thisZR = p53D.map(mVals[iR], minVal, maxVal, 0, Z_MAX);
    let zR = Math.max(thisZR, p53D.random(0.3, 0.5) * lastZR);
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
      const emotion = jsonA.header[ei];
      points[2 * ei + 0].push(jsonA.values[`${emotion}`][p]);
      points[2 * ei + 1].push(jsonC.values[`${emotion}`][p]);
    }
  }
  create2d();

  gridStep = Math.max(p53D.height / points.length, p53D.width / points[0].length);
  maxDim = Math.max(gridStep * points.length, gridStep * points[0].length);
  CAM_TRANS.x = -0.5 * gridStep * points[0].length;
  CAM_TRANS.y = -0.5 * gridStep * points.length;
  CAM_TRANS.z = -500;
}

function create2d() {
  m2dGraph = p53D.createGraphics(p53D.width, (p53D.height - menuHeight));
  m2dGraph.background(0, 0);
  m2dGraph.stroke(255);
  m2dGraph.noFill();

  for(let ei = 0; ei < points.length / 2; ei++) {
    const emotion = jsonA.header[ei];

    for(let p = 0; p < points[2 * ei].length - 1; p++) {
      const x0 = p53D.map(p, 0, points[2 * ei].length - 1, 0, m2dGraph.width);
      const y0 = p53D.map(points[2 * ei][p], 0, Z_MAX, m2dYpadding, m2dGraph.height - m2dYpadding);

      const x1 = p53D.map(p + 1, 0, points[2 * ei].length - 1, 0, m2dGraph.width);
      const y1 = p53D.map(points[2 * ei][p + 1], 0, Z_MAX, m2dYpadding, m2dGraph.height - m2dYpadding);

      m2dGraph.line(x0, y0, x1, y1);
    }
  }
}

const sketch2D = function(sketch) {
  sketch.setup = function() {
    const mCanvas = sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
    mCanvas.id('canvas2d');
    sketch.setAttributes('antialias', true);
    sketch.smooth();
    sketch.pixelDensity(2);
    sketch.randomSeed(1010);
    sketch.frameRate(24);
  }

  sketch.draw = function() {
    sketch.clear();
    sketch.background(0, 0);
    sketch.strokeWeight(3);
    sketch.stroke(255);
    sketch.fill(16);

    if(SHOW2D) {
      sketch.image(m2dGraph, 0, menuHeight);
    }
  }

  sketch.windowResized = function() {
    sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
    menuHeight = $('#my-menu').outerHeight();
    create2d();
  }
}

const sketch3D = function(sketch) {
  sketch.preload = function() {
    jsonA = sketch.loadJSON('assets/values-A.json');
    jsonC = sketch.loadJSON('assets/values-C.json');
    mImg = sketch.createImage(64, 64);
  }

  sketch.setup = function() {
    const mCanvas = sketch.createCanvas(sketch.windowWidth, sketch.windowHeight, sketch.WEBGL);
    mCanvas.id('canvas3d');
    sketch.setAttributes('antialias', true);
    sketch.smooth();
    sketch.pixelDensity(2);
    sketch.randomSeed(1010);
    sketch.frameRate(24);

    easycam = new Dw.EasyCam(this._renderer, CAM_INIT_STATE);
    menuHeight = $('#my-menu').outerHeight();

    readNewJsonFiles();
  }

  sketch.draw = function() {
    sketch.background(0);
    sketch.strokeWeight(3);
    sketch.stroke(255);
    sketch.fill(16);

    sketch.push();
    sketch.translate(CAM_TRANS.x, CAM_TRANS.y, CAM_TRANS.z);

    if (DISPLAY.LIGHTS) {
      sketch.fill(255);
      sketch.pointLight(250, 0, 0,   -CAM_TRANS.x/2, 0, 50);
      sketch.pointLight(0, 250, 0,   -CAM_TRANS.x, 0,   50);
      sketch.pointLight(0, 0, 250,   0, 0,              50);
      sketch.pointLight(250, 250, 0, CAM_TRANS.x, 0,    50);
      sketch.pointLight(250, 0, 250, CAM_TRANS.x/2, 0,  50);
    } else if (DISPLAY.TEXTURE || DISPLAY.TILE) {
      sketch.texture(mImg);
      sketch.textureMode(sketch.NORMAL);
    } else {
      sketch.fill(64);
      sketch.stroke(255);
      sketch.ambientLight(200,200,200);
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

        sketch.push();
        sketch.beginShape();
        if (DISPLAY.TILE) {
          sketch.vertex(x0, y0, points[h][w], 0, 0);
          sketch.vertex(x1, y0, points[h][w + 1], 1, 0);
          sketch.vertex(x1, y1, points[h + 1][w + 1], 1, 1);
          sketch.vertex(x0, y1, points[h + 1][w], 0, 1);
        } else if (DISPLAY.TEXTURE) {
          sketch.vertex(x0, y0, points[h][w], x0n, y0n);
          sketch.vertex(x1, y0, points[h][w + 1], x1n, y0n);
          sketch.vertex(x1, y1, points[h + 1][w + 1], x1n, y1n);
          sketch.vertex(x0, y1, points[h + 1][w], x0n, y1n);
        } else {
          sketch.vertex(x0, y0, points[h][w]);
          sketch.vertex(x1, y0, points[h][w + 1]);
          sketch.vertex(x1, y1, points[h + 1][w + 1]);
          sketch.vertex(x0, y1, points[h + 1][w]);
        }
        sketch.endShape(sketch.CLOSE);
        sketch.pop();
      }
    }
    sketch.pop();
  }

  sketch.windowResized = function() {
    sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
    easycam.setViewport([0,0,sketch.windowWidth, sketch.windowHeight]);
    menuHeight = $('#my-menu').outerHeight();
  }
};

const p53D = new p5(sketch3D);
const p52D = new p5(sketch2D);

$(() => {
  $(".file-input-json").change((event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      if(event.target.id === 'my-a-file') {
        jsonA = JSON.parse(readerEvent.target.result);
        jsonALoaded = true;
        event.target.classList.add('file-input-disable');
      } else if(event.target.id === 'my-c-file') {
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

  $(".file-input-image").change((event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (readerEvent) {
      const image = new Image();
      image.onload = function (imageEvent) {
        const MAX_DIM = 1024;
        let iWidth = image.width;
        let iHeight = image.height;
        let minDim = Math.min(image.width, image.height);

        if ((iWidth > iHeight) && (iHeight > MAX_DIM)) {
          iWidth *= MAX_DIM / iHeight;
          iHeight = MAX_DIM;
        } else if (iWidth > MAX_DIM) {
          iHeight *= MAX_DIM / iWidth;
          iWidth = MAX_DIM;
        }
        const newDim = Math.min(iWidth, iHeight);

        mImg.resize(newDim, newDim);
        mImg.drawingContext.drawImage(image, 0, 0, minDim, minDim,
                                      0, 0, newDim, newDim);

        document.getElementById('my-texture-box').classList.remove('file-input-disable');
        document.getElementById('my-texture-label').classList.remove('file-input-disable');
        if (event.target) event.target.value = '';
      }
      image.src = readerEvent.target.result;
    }
    reader.readAsDataURL(file);
  });

  $('#my-color-box').click(() => {
    DISPLAY.LIGHTS = $('#my-color-box').is(":checked");

    if(DISPLAY.LIGHTS) {
      $('#my-texture-box').prop('checked', false);
      $('#my-tile-box').prop('checked', false);
      DISPLAY.TEXTURE = false;
      DISPLAY.TILE = false;
      $('#my-texture-box').prop('checked', DISPLAY.TEXTURE);
      $('#my-tile-box').prop('checked', DISPLAY.TILE);
      document.getElementById('my-tile-box').classList.add('file-input-disable');
      document.getElementById('my-tile-label').classList.add('file-input-disable');
    }
  });

  $('#my-texture-box').click(() => {
    DISPLAY.TEXTURE = $('#my-texture-box').is(":checked");

    if (DISPLAY.TEXTURE) {
      document.getElementById('my-tile-box').classList.remove('file-input-disable');
      document.getElementById('my-tile-label').classList.remove('file-input-disable');
    } else {
      document.getElementById('my-tile-box').classList.add('file-input-disable');
      document.getElementById('my-tile-label').classList.add('file-input-disable');
      DISPLAY.TILE = false;
      $('#my-tile-box').prop('checked', DISPLAY.TILE);
    }
  });

  $('#my-tile-box').click(() => {
    DISPLAY.TILE = $('#my-tile-box').is(":checked");
  });

  $('#my-2d-box').click(() => {
    SHOW2D = $('#my-2d-box').is(":checked");
  });
});
