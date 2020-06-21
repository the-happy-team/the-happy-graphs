let mJson;
const points = [];
const pointsR = [];
const AVG_SIZE_2 = 10;
let Xrot = .8;
let Zrot = .2;

function preload() {
  mJson = loadJSON('../assets/__values-A.json');
}

function setup() { 
  createCanvas(1280, 600, WEBGL);
  noLoop();

  mJson.header = mJson.header.filter((e) => e!='time');
  mJson.values['neutral'].reverse();

  for(let ei = 0; ei < mJson.header.length; ei++) {
    const e = mJson.header[ei];
    const mVals = mJson.values[e];
    const mPs = [];
    const mPsR = [];

    for(let vi = AVG_SIZE_2; vi < mVals.length; vi++) {
      const viR = mVals.length - 1 - vi;

      const x = map(vi, 0, mVals.length - 1, 0, width);
      const y = map(ei, 0, mJson.header.length - 2, 0, height);

      //const xR = map(vi, 0, mVals.length - 1, 0, width);
      //const yR = map(ei, 0, mJson.header.length - 2, 0, height);

      let zsum = 0;
      let zsumR = 0;
      for(let z = vi - AVG_SIZE_2; z < vi + AVG_SIZE_2; z++) {
        zsum += map(mVals[vi], mJson.minVals[e], mJson.maxVals[e], 0, 200);
        zsumR += map(mVals[viR], mJson.minVals[e], mJson.maxVals[e], 0, 200);
      }

      const z = zsum/(2 * AVG_SIZE_2);
      const zR = zsumR/(2 * AVG_SIZE_2);

      if(e === 'neutral') {
        mPs.push(createVector(x, y, 250-z));
        mPsR.push(createVector(x, y, 250-zR));
      } else {
        mPs.push(createVector(x, y, z));
        mPsR.push(createVector(x, y, zR));
      }
    }
    points.push(mPs);
    pointsR.push(mPsR);
  }
  drawGraph();
}

function drawGraph() {
  background(0);
  strokeWeight(3);
  stroke(255);
  push();
  rotateX(Xrot);
  rotateZ(Zrot);
  translate(-0.8 * width, -height, -200);

  for(let h = 1; h < points.length; h++) {
    let backW = points[0].length - 1;

    const lastZ = [
      points[0][0].z,
      points[0][0].z,
      points[0][0].z
    ];

    for(let w = 1; w < points[h].length; w++) {
      const thisZ = [
        Math.max(points[h-0][w].z, 0.5 * pointsR[h-0][w].z, 0.5 * lastZ[0]),
        Math.max(points[h-1][w].z, 0.5 * pointsR[h-1][w].z, 0.5 * lastZ[1]),
        Math.max(points[h][w-1].z, 0.5 * pointsR[h][w-1].z, 0.5 * lastZ[2])
      ];

      line(points[h][w].x, points[h][w].y, thisZ[0],
           points[h-1][w].x, points[h-1][w].y, thisZ[1]);
      line(points[h][w].x, points[h][w].y, thisZ[0],
           points[h][w-1].x, points[h][w-1].y, thisZ[2]);
      fill(255,0,0);

      for (let i = 0; i < thisZ.length; i++) {
        lastZ[i] = thisZ[i];
      }
    }
  }
  pop();
}

function mouseDragged() {
  Xrot = map(mouseY, 0, width, PI/2, -PI/2);
  Zrot = map(mouseX, 0, width, PI/2, -PI/2);
  drawGraph();
}
