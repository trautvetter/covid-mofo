// GUI params
let visualisationParams = {
  pause: true
};

let behaviourParams = {
  stayAtHome: true,
  physDistance: false
};

let healthStats = {
  numInfected: 0
};

let recorder = {
  record: function() { record() },
}
//


let bubbleSpace = 150;
let bubbleDiameter = 50;
let columns;
let rows;

// gui
var gui;
var visibility = true;

let bubbles = [];
let peoples = [];

let canvasWidth = 2000;
let canvasHeight = 1000;

function record() {
  chunks.length = 0;
  let stream = document.querySelector('canvas').captureStream(30),
      recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => {
    if (e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onstop = exportVideo;
  btn.onclick = e => {
    recorder.stop();
    btn.textContent = 'start recording';
    btn.onclick = record;
  };
  recorder.start();
  btn.textContent = 'stop recording';
}

function exportVideo(e) {
  var blob = new Blob(chunks);
  var vid = document.createElement('video');
  vid.id = 'recorded'
  vid.controls = true;
  vid.src = URL.createObjectURL(blob);
  document.body.appendChild(vid);
  vid.play();
}


pauseControllerEvent = (function() {
  if (visualisationParams.pause) {
    noLoop();
  } else {
    loop();
  }
});


function setup() {

  // createCanvas(canvasWidth, canvasHeight);
  createCanvas(windowWidth, windowHeight);
  frameRate(30);

  // Calculate columns and rows
  columns = floor(width / bubbleSpace);
  rows = floor(height / bubbleSpace);

  for ( let i = 1; i < columns; i++) {
    for ( let j = 1; j < rows; j++) {
      let bubble = new Bubble(i * bubbleSpace, j * bubbleSpace)
      bubbles.push(bubble);

      let bubbleOccupancy = random(0, 5);
      for (let k = 0; k < bubbleOccupancy; k++) {
        peoples.push(new Person(bubble.x, bubble.y, bubble));
      }
    }
  }

  // Create Layout GUI
  gui = new dat.GUI();
  var f1 = gui.addFolder('Visualisation');
  var pauseController = f1.add(visualisationParams, 'pause').name('Pause');
  pauseController.onChange(function() {
    pauseControllerEvent();
  });
  pauseControllerEvent();

  var f2 = gui.addFolder('Rules');
  f2.add(behaviourParams, 'stayAtHome').name('Stay at home');
  f2.add(behaviourParams, 'physDistance').name('Physical distance');

  f1.open();
  f2.open();

  var numberInfectedController = gui.add(healthStats, 'numInfected', 0, peoples.length).listen().name('Number infected');
  numberInfectedController.onChange(function() {

  });


  var obj = { add:function(){ console.log("clicked") }};

  var recordButtonController = gui.add(recorder,'record').name('Record');
  recordButtonController.onChange(function() {
    record();
  });


  init();

}

// check for keyboard events
function keyPressed() {
  switch(key) {
    // type [p] to open / close the GUI
    case 'p':
      visibility = !visibility;
      if (visibility){
        gui.open();
      } else {
        gui.close();
      }
      break;
    case 'h':
      gui.toggleHide();
      break;

  }
}

// Main loop
function draw() {
  background(255);
  stroke(0);

  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].display();
  }

  for (let i = 0; i < peoples.length; i++) {
    if (behaviourParams.stayAtHome) {
      if (peoples[i].isAtHome()) {
        peoples[i].moveAtHome();
      } else {
        peoples[i].goHome();
      }
    } else {
      peoples[i].moveOutOfHome();
    }
    peoples[i].display();

    for (let j = 0; j < peoples.length; j++) {
      if (i !== j && peoples[i].intersects(peoples[j])) {
        if (peoples[i].isInfected() && !peoples[j].isInfected()){
          peoples[j].infect();
        }
      }
    }
  }
}

// reset board when mouse is pressed
function mousePressed() {

}

// dynamically adjust the canvas to the window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function init() {



  // infect some random people as seeds
  let infectedSeedCount = 1;
  for (let n = 0; n < infectedSeedCount; n++) {
    let x = floor(random(1, peoples.length));
    peoples[x].infect();
  }
}


// Bubble class
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // give me some random color values:
    this.r = random(128, 255);
    this.g = random(0, 192);
    this.b = random(0, 50);
    this.a = random(50, 100);
  }

  display() {
    // draw the stuff:
    fill(this.r, this.g, this.b, this.a);
    ellipse(this.x, this.y, bubbleDiameter, bubbleDiameter);
  }
}



class Person {
  constructor(x, y, homeBubble) {
    this.homeBubble = homeBubble;
    this.x = x;
    this.y = y;
    this.diameter = 10;

    this.xspeed = random(-2.8, 2.8); // Speed of the shape
    this.yspeed = random(-2.2, 2.2); // Speed of the shape

    this.xdirection = 1; // Left or Right
    this.ydirection = 1; // Top to Bottom

    this.angle = 0;
    this.angleIncrement = random(0.01, 0.1);

    // Human like properties
    // 10 perfect 0, dead
    this.health = 10;
  }

  intersects(other) {
    var d = dist(this.x, this.y, other.x, other.y);
    return (d < this.diameter / 2 + other.diameter / 2);
  }

  near(other) {
    var d = dist(this.x, this.y, other.x, other.y);
    return (d < this.diameter * 2 + other.diameter * 2);
  }

  setHealth(health) {
    this.health = health;
  }

  infect(){
    healthStats.numInfected++;
    this.health = 9;
  }

  isInfected(){
    return this.health < 10;
  }

  display() {

    // give me some random color values:
    let r = random(128, 255);
    let g = random(0, 192);
    let b = random(0, 50);
    let a = random(50, 100);

    // draw the stuff:
    switch (Number(this.health)) {
      case 0: // person is dead
        fill(0, 0, 0);
        push();
        stroke(255, 255, 255);
        strokeWeight(2);
        // todo add to morgue
        this.x = 100;
        this.y = 100;
        break;
      case 9: // asymptomatic infection
        fill(255, 0, 0, 100);
        push();
        stroke(255, 204, 0);
        strokeWeight(2);

        break;
      case 8: // asymptomatic infection
        fill(255, 0, 0, 50);
        push();
        break;

      default:
        fill(r, g, b, a);
        push();
        break;
    }

    ellipse(this.x, this.y, this.diameter, this.diameter);
    pop();

  }

  isAtHome(){
    let d = dist(this.x, this.y, this.homeBubble.x, this.homeBubble.y);
    return (d <= bubbleDiameter/2);
  }

  goHome() {

    var currentLocation = createVector(this.x,this.y);

    var target = createVector(this.homeBubble.x, this.homeBubble.y);

    // Calculate the distance between target and
    // the current location of your person
    var distance = target.dist(currentLocation);

    // map the distance between your location and
    // the bubble to a new number which will dictate how
    // much slower it will move based on how close it
    // will get to the target.
    var mappedDistance = map(distance, 100, 0, 2.5, 1.5);

    // this is where you actually calculate the direction
    // of your target towards your rect.
    target.sub(currentLocation);

    // then you're going to normalize that value
    // (normalize sets the length of the vector to 1)
    target.normalize();

    // then you can multiply that vector by the distance
    // we mapped to a new number (in this case it gets
    // multiplied somewhere between 2.5 and 1.5 based
    // on how far the target is.)
    target.mult(mappedDistance);

    // last we add the target vector (which we modfied
    // multiple times) to the current location.
    currentLocation.add(target);

    // draw and watch math do it's job!
    this.x = currentLocation.x;
    this.y = currentLocation.y;
  }

  moveAtHome() {

    if (Number(this.health) > 0) {

      this.x = this.homeBubble.x + (bubbleDiameter / 2 - 7) * cos(this.angle);
      this.y = this.homeBubble.y + (bubbleDiameter / 2 - 7) * sin(this.angle);

      this.angle += this.angleIncrement;
    }

  }

  moveOutOfHome() {

    if (Number(this.health) > 0) {

      // Update the position of the shape
      this.x = this.x + this.xspeed * this.xdirection;
      this.y = this.y + this.yspeed * this.ydirection;

      if (behaviourParams.physDistance){
        for (let i = 0; i < peoples.length; i++){
          if (this.near(peoples[i])){
            this.yspeed *= -1;
          }
        }
      }

      // Test to see if the shape exceeds the boundaries of the screen
      // If it does, reverse its direction by multiplying by -1
      if (this.x > canvasWidth - this.diameter / 2 || this.x < this.diameter / 2) {
        this.xdirection *= -1;
      }
      if (this.y > canvasHeight - this.diameter / 2 || this.y < this.diameter / 2) {
        this.ydirection *= -1;
      }

    }

  }
}