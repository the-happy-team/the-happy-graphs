let mJson;
const points = [];
const pointsR = [];
const AVG_SIZE_2 = 0;

function preload() {
  mJson = loadJSON('../assets/__values-A.json');
}

function setup() { 
  createCanvas(800, 600);
  noLoop();

  const e = 'happy';
  const mVals = mJson.values[e];
  const minVal = mJson.minVals[e];
  const maxVal = mJson.maxVals[e];

  let lastY = 0;
  let lastYR = 0;

  for(let vi = AVG_SIZE_2; vi < mVals.length - AVG_SIZE_2; vi++) {
    const viR = mVals.length - AVG_SIZE_2 - 1 - vi;

    const x = map(vi, 0, mVals.length - 1, 0, width);

    let ysum = 0;
    for(let yi = vi - AVG_SIZE_2; yi < vi + AVG_SIZE_2 + 1; yi++) {
      ysum += map(mVals[yi], minVal, maxVal, 0, height);
    }
    const y = Math.max(ysum / (2 * AVG_SIZE_2 + 1), 0.5 * lastY);
    lastY = y;
    
    let ysumR = 0;
    for(let yi = viR - AVG_SIZE_2; yi < viR + AVG_SIZE_2 + 1; yi++) {
      const my = map(mVals[yi], minVal, maxVal, 0, height);
      ysumR += my;
    }
    const yR = Math.max(ysumR / (2 * AVG_SIZE_2 + 1), 0.5 * lastYR);
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
  }
}
