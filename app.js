class EventEmitter {
  constructor() {
    // object holding event arrays
    this.listeners = {};
  }

  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    // put listener into array
    this.listeners[message].push(listener);
  }

  emit(message, payload) {
    // trigger all functions tied to message
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
}

// message names
const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};

// global state vars
let heroImg, 
    enemyImg, 
    laserImg,
    canvas, ctx, 
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter();


class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }

  // put image on canvas
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

// player ship
class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 75;
    this.type = "Hero";
    this.speed = 5;
  }
}

// enemyShip
class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    
    // auto move down
    const id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        // hit bottom, stop interval
        console.log('stopped at', this.y);
        clearInterval(id);
      }
    }, 300);
  }
}

// async image loader
function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

// calc grid and spawn enemies
function createEnemies() {
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  // center formation
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  // 5x5 grid
  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

// spawn player bottom center
function createHero() {
  hero = new Hero(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );
  hero.img = heroImg;
  gameObjects.push(hero);
}

// render active objects
function drawGameObjects(ctx) {
  gameObjects.forEach(go => go.draw(ctx));
}

// wipe array, spawn en and hero
function initGame() {
  gameObjects = [];
  createEnemies();
  createHero();

  // map events to coordinate math
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
  });
}

// block browser scrolling when playin 
const onKeyDown = function (e) {
  console.log(e.keyCode);
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // arrows
    case 32: // spacebar
      e.preventDefault(); 
      break; 
    default:
      break; 
  }
};
window.addEventListener("keydown", onKeyDown);

// keydown instead of keyup like tut, its just way more convenient for gaming personally
window.addEventListener("keydown", (evt) => {
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  }
});


window.onload = async () => {
  // get canvas context
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  
  // await asset downloads
  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");


  initGame();
  

  const gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameObjects(ctx);
  }, 100); // 10 fps lol
};