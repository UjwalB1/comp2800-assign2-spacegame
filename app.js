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
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
};

// global state vars
let heroImg, 
    enemyImg, 
    laserImg,
    lifeImg,
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

  // get collision bounds
  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
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
    this.cooldown = 0;
    // setup life n score
    this.life = 3;
    this.points = 0;
  }

  // spawn laser above ship
  fire() {
    gameObjects.push(new Laser(this.x + 45, this.y - 10));
    this.cooldown = 500;

    // reset cooldown timer n kill instantly
    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
        if (this.cooldown === 0) {
          clearInterval(id);
        }
      }
    }, 200);
  }

  // check if ready to fire
  canFire() {
    return this.cooldown === 0;
  }

  // lose health on crash
  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }

  // gain score on kill
  incrementPoints() {
    this.points += 100;
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

// shooting logic
class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = 'Laser';
    this.img = laserImg;
    
    // travel up til off screen
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

// separation test for collisions
function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

// collision checks
function updateGameObjects() {
  const enemies = gameObjects.filter(go => go.type === 'Enemy');
  const lasers = gameObjects.filter(go => go.type === "Laser");
  
  // check every laser against every enemy
  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy,
        });
      }
    });
  });

  // check if enemy hit ship
  enemies.forEach(enemy => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  });

  // clear dead objects from arr
  gameObjects = gameObjects.filter(go => !go.dead);
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

// draw ship icons for lives
function drawLife() {
  const START_POS = canvas.width - 180;
  for(let i=0; i < hero.life; i++ ) {
    ctx.drawImage(
      lifeImg, 
      START_POS + (45 * (i+1) ), 
      canvas.height - 37);
  }
}

// draw points text
function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height-20);
}

// canvas text
function drawText(message, x, y) {
  ctx.fillText(message, x, y);
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

  // fire weapon
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });

  // delete both on hit
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints(); // give points
  });

  // kill enemy n drop health
  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
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
  } else if (evt.keyCode === 32) {
    // spacebar triggers event
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
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
  lifeImg = await loadTexture("assets/life.png");

  initGame();
  
  const gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // check hits n cleanup dead bods
    updateGameObjects();
    drawPoints();
    drawLife();
    drawGameObjects(ctx);
  }, 100); // 10 fps lol
};