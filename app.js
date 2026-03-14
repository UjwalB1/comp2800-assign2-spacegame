function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      resolve(img)
    }
  })
}

function createEnemies(ctx, canvas, enemyImg) {
  // TODO draw enemies
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING) {
    for (let y = 0; y < 50 * 5; y += 50) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

window.onload = async () => {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')
  
  // TODO load textures
  const heroImg = await loadTexture('assets/player.png');
  const enemyImg = await loadTexture('assets/enemyShip.png');

  // TODO draw black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // TODO draw hero
  ctx.drawImage(heroImg, canvas.width / 2 - 45, canvas.height - canvas.height / 4);

  // TODO uncomment the next line when you add enemies to screen
  createEnemies(ctx, canvas, enemyImg);
}