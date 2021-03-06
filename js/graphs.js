let jsonA;
let jsonC;
let mImg;
let m2dGraph;

let jsonALoaded = false;
let jsonCLoaded = false;

const Z_MAX = 500;
const V_FILTER = 0.005;

const points3D = [];
const points2D = [];
let gridStep;
let maxDim;

let mCam;
let menuHeight;

const OVERSAMPLE = 2;
let displayMode3D = 'AC';
let m2dYpadding = OVERSAMPLE * 16;
let lineWeight2d = OVERSAMPLE * 1;

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
const CAM_TRANS_DELTA = 16;

const CAM_INIT_STATE = {
  distance : 2500,
  center   : [0, 0, 0],
  rotation : [Math.sqrt(2) / 2, -Math.sqrt(3) / 2, 0, 0]
};

function preProcessJson(mj) {
  mj.header = mj.header.filter((e) => e != 'time');
  mj.header.push(mj.header.splice(mj.header.indexOf('neutral'), 1)[0]);

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
  preProcessJson(jsonA);
  preProcessJson(jsonC);

  for(let e of jsonA.header) {
    smoothEmotionValues(jsonA, e);
    smoothEmotionValues(jsonC, e);
  }

  createEmoMenu('2d', create2d);
  createEmoMenu('3d', create2d3dPoints);
  create2d3dPoints();
  create2d();

  gridStep = Math.max(p53D.height / points3D.length, p53D.width / points3D[0].length);
  maxDim = Math.max(gridStep * points3D.length, gridStep * points3D[0].length);
  CAM_TRANS.x = -0.5 * gridStep * points3D[0].length;
  CAM_TRANS.y = -0.5 * gridStep * points3D.length;
  CAM_TRANS.z = -500;
}

function createEmoMenu(dim = '2d', fun = create2d) {
  const mdiv = $(`#my-emo-${dim}-box-container`);
  mdiv.empty();
  mdiv.append(`${dim}: `);

  for(let e of jsonA.header) {
    mdiv.append($(`<label for="${e}-${dim}">${e}</label>`).addClass(`file-input-disable-${dim}`).addClass(`emo-${dim}-box-label`));
    mdiv.append($(`<input name="${e}-${dim}" type="checkbox">`).click(fun).attr('checked', true).addClass(`file-input-disable-${dim}`).addClass(`emo-${dim}-box`));
  }
}

function create2d3dPoints() {
  points3D.length = 0;
  points3D.push([]);
  points2D.length = 0;
  points2D.push([]);

  for(let e of jsonA.header) {
    points3D.push([]);
    points2D.push([]);
    if(displayMode3D != 'C') {
      points3D.push([]);
    }
  }
  points3D.push([]);
  points2D.push([]);

  for(let p = 0; p < jsonA.values['happy'].length && p < jsonC.values['happy'].length; p++) {
    const isLastP = ((p+1) >= jsonA.values['happy'].length) || ((p+1) >= jsonC.values['happy'].length);

    if((p === 0) || isLastP) {
      points3D[0].push(0);
      points2D.push([]);
    }
    points3D[0].push(0);
    points2D.push([]);

    for(let ei = 0; ei < jsonA.header.length; ei++) {
      const emotion = jsonA.header[ei];
      const showEmotion = $(`input[name="${emotion}-3d"]`).is(':checked');

      const valA = showEmotion ? jsonA.values[`${emotion}`][p] : 0;
      const valC = showEmotion ? jsonC.values[`${emotion}`][p] : 0;
      const valApad = (valA < Z_MAX / 2) ? 0 : Z_MAX;
      const valCpad = (valC < Z_MAX / 2) ? 0 : Z_MAX;
      const valA2D = jsonA.values[`${emotion}`][p];
      const valA2Dpad = (valA2D < Z_MAX / 2) ? 0 : Z_MAX;

      if(p == 0) {
        if(displayMode3D == 'AC') {
          points3D[2 * ei + 0 + 1].push(valApad);
          points3D[2 * ei + 1 + 1].push(valCpad);
        } else if(displayMode3D == 'C') {
          points3D[ei + 0 + 1].push(valCpad);
        } else if(displayMode3D == 'CC') {
          points3D[ei + 0 + 1].push(valCpad);
          points3D[ei + jsonA.header.length + 1].push(valCpad);
        } else if(displayMode3D == 'CcCc') {
          points3D[2 * ei + 0 + 1].push(valCpad);
          points3D[2 * ei + 1 + 1].push(valCpad);
        }
        points2D[ei + 1].push(valA2Dpad);
      }

      if(displayMode3D == 'AC') {
        points3D[2 * ei + 0 + 1].push(valA);
        points3D[2 * ei + 1 + 1].push(valC);
      } else if(displayMode3D == 'C') {
        points3D[ei + 0 + 1].push(valC);
      } else if(displayMode3D == 'CC') {
        points3D[ei + 0 + 1].push(valC);
        points3D[ei + jsonA.header.length + 1].push(valC);
      } else if(displayMode3D == 'CcCc') {
        points3D[2 * ei + 0 + 1].push(valC);
        points3D[2 * ei + 1 + 1].push(valC);
      }
      points2D[ei + 1].push(valA2D);

      if(isLastP) {
        if(displayMode3D == 'AC') {
          points3D[2 * ei + 0 + 1].push(valApad);
          points3D[2 * ei + 1 + 1].push(valCpad);
        } else if(displayMode3D == 'C') {
          points3D[ei + 0 + 1].push(valCpad);
        } else if(displayMode3D == 'CC') {
          points3D[ei + 0 + 1].push(valCpad);
          points3D[ei + jsonA.header.length + 1].push(valCpad);
        } else if(displayMode3D == 'CcCc') {
          points3D[2 * ei + 0 + 1].push(valCpad);
          points3D[2 * ei + 1 + 1].push(valCpad);
        }
        points2D[ei + 1].push(valA2Dpad);
      }
    }

    if(displayMode3D == 'C') {
      points3D[jsonA.header.length + 1].push(0);
    } else {
      points3D[2 * jsonA.header.length + 1].push(0);
    }
    points2D[jsonA.header.length + 1].push(0);
  }
}

function create2d() {
  m2dGraph = p53D.createGraphics(p53D.width, p53D.height);
  m2dGraph.background(0, 0);
  m2dGraph.stroke(255);
  m2dGraph.strokeWeight(lineWeight2d);
  m2dGraph.noFill();

  for(let ei = 0; ei < jsonA.header.length; ei++) {
    const emotion = jsonA.header[ei];
    const numPoints = points2D[ei + 1].length - 1;
    const showEmotion = $(`input[name="${emotion}-2d"]`).is(':checked');

    for(let p = 0; (showEmotion && (p < numPoints)); p++) {
      const x0 = p53D.map(p, 0, numPoints, 0, m2dGraph.width);
      const y0 = p53D.map(points2D[ei + 1][p], 0, Z_MAX, m2dGraph.height - m2dYpadding, m2dYpadding);

      const x1 = p53D.map(p + 1, 0, numPoints, 0, m2dGraph.width);
      const y1 = p53D.map(points2D[ei + 1][p + 1], 0, Z_MAX, m2dGraph.height - m2dYpadding, m2dYpadding);

      m2dGraph.line(x0, y0, x1, y1);
    }
  }
}

const sketch2D = function(sketch) {
  sketch.setup = function() {
    menuHeight = $('#my-menu').outerHeight();
    let mWidth = sketch.windowWidth;
    let mHeight = sketch.windowHeight - menuHeight;
    let nHeight = Math.round(mWidth * 1080.0 / 1920.0);

    if (nHeight < mHeight) {
      mHeight = nHeight;
    } else {
      mWidth = Math.round(mHeight * 1920.0 / 1080.0);
    }

    const mCanvas = sketch.createCanvas(OVERSAMPLE * mWidth, OVERSAMPLE * mHeight);
    mCanvas.parent('my-canvas-container');
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
    sketch.stroke(255);
    sketch.fill(16);

    if(SHOW2D) {
      sketch.image(m2dGraph, 0, 0);
    }
  }
}

const sketch3D = function(sketch) {
  sketch.preload = function() {
    jsonA = sketch.loadJSON('assets/values-A.json');
    jsonC = sketch.loadJSON('assets/values-C.json');
    mImg = sketch.createImage(64, 64);
  }

  sketch.setup = function() {
    menuHeight = $('#my-menu').outerHeight();
    let mWidth = sketch.windowWidth;
    let mHeight = sketch.windowHeight - menuHeight;
    let nHeight = Math.round(mWidth * 1080.0 / 1920.0);

    if (nHeight < mHeight) {
      mHeight = nHeight;
    } else {
      mWidth = Math.round(mHeight * 1920.0 / 1080.0);
    }

    const mCanvas = sketch.createCanvas(OVERSAMPLE * mWidth, OVERSAMPLE * mHeight, sketch.WEBGL);
    mCanvas.parent('my-canvas-container');
    mCanvas.id('canvas3d');
    sketch.setAttributes('antialias', true);
    sketch.smooth();
    sketch.pixelDensity(2);
    sketch.randomSeed(1010);
    sketch.frameRate(24);

    mCam = sketch.createSimpleCam();
    mCam.zoom = new Damp(1500, -5, 0.07, [-4000, 4000]);
    mCam.rx = new Damp(-Math.PI / 2, 0.01, 0.1);
    mCam.ry = new Damp(0 / 2, 0.01, 0.1);

    readNewJsonFiles();
  }

  sketch.draw = function() {
    mCam.apply();
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

    for(let h = 0; h < points3D.length - 1; h++) {
      const y0 = gridStep * (h + 0);
      const y1 = gridStep * (h + 1);

      const y0n = y0 / maxDim;
      const y1n = y1 / maxDim;

      for(let w = 0; w < points3D[h].length - 1; w++) {
        const x0 = gridStep * (w + 0);
        const x1 = gridStep * (w + 1);

        const x0n = x0 / maxDim;
        const x1n = x1 / maxDim;

        sketch.push();
        sketch.beginShape();
        if (DISPLAY.TILE) {
          sketch.vertex(x0, y0, points3D[h][w], 0, 0);
          sketch.vertex(x1, y0, points3D[h][w + 1], 1, 0);
          sketch.vertex(x1, y1, points3D[h + 1][w + 1], 1, 1);
          sketch.vertex(x0, y1, points3D[h + 1][w], 0, 1);
        } else if (DISPLAY.TEXTURE) {
          sketch.vertex(x0, y0, points3D[h][w], x0n, y0n);
          sketch.vertex(x1, y0, points3D[h][w + 1], x1n, y0n);
          sketch.vertex(x1, y1, points3D[h + 1][w + 1], x1n, y1n);
          sketch.vertex(x0, y1, points3D[h + 1][w], x0n, y1n);
        } else {
          sketch.vertex(x0, y0, points3D[h][w]);
          sketch.vertex(x1, y0, points3D[h][w + 1]);
          sketch.vertex(x1, y1, points3D[h + 1][w + 1]);
          sketch.vertex(x0, y1, points3D[h + 1][w]);
        }
        sketch.endShape(sketch.CLOSE);
        sketch.pop();
      }
    }

    sketch.pop();
    checkKeys();
  }

  function checkKeys() {
    if(sketch.keyIsDown(sketch.SHIFT)) {
      if(sketch.keyIsDown(sketch.UP_ARROW)) {
        CAM_TRANS.y -= CAM_TRANS_DELTA;
      } else if(sketch.keyIsDown(sketch.DOWN_ARROW)) {
        CAM_TRANS.y += CAM_TRANS_DELTA;
      }
    } else {
      if(sketch.keyIsDown(sketch.UP_ARROW)) {
        CAM_TRANS.z += CAM_TRANS_DELTA;
      } else if(sketch.keyIsDown(sketch.DOWN_ARROW)) {
        CAM_TRANS.z -= CAM_TRANS_DELTA;
      } else if(sketch.keyIsDown(sketch.LEFT_ARROW)) {
        CAM_TRANS.x += CAM_TRANS_DELTA;
      } else if(sketch.keyIsDown(sketch.RIGHT_ARROW)) {
        CAM_TRANS.x -= CAM_TRANS_DELTA;
      }
    }
  }
};

const p53D = new p5(sketch3D);
const p52D = new p5(sketch2D);

$(() => {
  $('.file-input-json').change((event) => {
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

  $('.file-input-image').change((event) => {
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
    if(SHOW2D){
      $('.emo-2d-box').removeClass('file-input-disable-2d');
      $('.emo-2d-box-label').removeClass('file-input-disable-2d');
      $('#my-line-thickness-label').removeClass('file-input-disable');
      $('#my-line-thickness').removeClass('file-input-disable');
      $('#my-vertical-padding-2d-label').removeClass('file-input-disable');
      $('#my-vertical-padding-2d').removeClass('file-input-disable');
    } else {
      $('.emo-2d-box').addClass('file-input-disable-2d');
      $('.emo-2d-box-label').addClass('file-input-disable-2d');
      $('#my-line-thickness-label').addClass('file-input-disable');
      $('#my-line-thickness').addClass('file-input-disable');
      $('#my-vertical-padding-2d-label').addClass('file-input-disable');
      $('#my-vertical-padding-2d').addClass('file-input-disable');
    }
  });

  $('#my-line-thickness').change(() => {
    lineWeight2d = OVERSAMPLE * parseInt($('#my-line-thickness').val());
    create2d();
  });

  $('#my-vertical-padding-2d').change(() => {
    m2dYpadding = OVERSAMPLE * parseInt($('#my-vertical-padding-2d').val());
    create2d();
  });

  $('#my-show-artist-3d').change(() => {
    displayMode3D = $('#my-show-artist-3d').val();
    create2d3dPoints();
  });

  $('#my-save-button').click(() => {
    const mCanvasSave = document.createElement('canvas');
    const mDownloadHref = document.createElement('a');
    const m2dCanvas = document.getElementById('canvas2d');
    const m3dCanvas = document.getElementById('canvas3d');
    const mCanvasSaveCtx = mCanvasSave.getContext('2d');

    mCanvasSave.width = m2dCanvas.width;
    mCanvasSave.height = m2dCanvas.height;

    mCanvasSaveCtx.drawImage(m3dCanvas, 0, 0);
    mCanvasSaveCtx.drawImage(m2dCanvas, 0, 0);

    const mPNGURL = mCanvasSave.toDataURL('image/png').replace(/^data:image\/[^;]*/,
                                                               'data:application/octet-stream');
    mDownloadHref.setAttribute('download', `happy_${moment().format('YYYYMMDD__HHmmss')}.png`);
    mDownloadHref.setAttribute('href', mPNGURL);
    setTimeout(() => mDownloadHref.click(), 100);
  });
});
