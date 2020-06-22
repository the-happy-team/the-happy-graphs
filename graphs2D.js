let mJson;
const points = [];
const pointsR = [];

function preload() {
  mJson = loadJSON('../assets/values-A.json');
}

function setup() {
  const cc = document.getElementById('canvas-container');
  const mCanvas = createCanvas(cc.offsetWidth, cc.offsetHeight);
  mCanvas.parent('canvas-container');
  mCanvas.id('my-canvas');

  smooth();
  pixelDensity(2);
  noLoop();

  const e = 'happy';
  const mVals = mJson.values[e];
  const minVal = mJson.minVals[e];
  const maxVal = mJson.maxVals[e];

  let lastY = 0;
  let lastYR = 0;

  for(let vi = 0; vi < mVals.length; vi++) {
    const viR = mVals.length - 1 - vi;

    const x = map(vi, 0, mVals.length - 1, 0, width);

    const thisY = map(mVals[vi], minVal, maxVal, 0, height);
    const y = Math.max(thisY, 0.5 * lastY);
    lastY = y;

    const thisYR = map(mVals[viR], minVal, maxVal, 0, height);
    const yR = Math.max(thisYR, 0.5 * lastYR);
    lastYR = yR;

    points.push(createVector(x, y));
    pointsR.push(createVector(x, yR));
  }
  pointsR.reverse();
  drawGraph();
}

function drawGraph() {
  background(0);
  strokeWeight(3);
  stroke(255);

  for(let p = 1; p < points.length; p++) {
    stroke(255);
    line(points[p].x, height - points[p].y,
         points[p-1].x, height - points[p-1].y);
    stroke(150,20,20);
    line(points[p].x, height - pointsR[p].y,
         points[p-1].x, height - pointsR[p-1].y);
    stroke(50,120,20);
    line(points[p].x, height - Math.max(pointsR[p].y, points[p].y),
         points[p-1].x, height - Math.max(pointsR[p-1].y, points[p-1].y));
  }
}
