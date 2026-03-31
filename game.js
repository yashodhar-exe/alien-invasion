var sprites = {
 ship: { sx: 0, sy: 0, w: 37, h: 42, frames: 1 },
 missile: { sx: 0, sy: 30, w: 2, h: 10, frames: 1 },
 enemy_purple: { sx: 37, sy: 0, w: 42, h: 43, frames: 1 },
 enemy_bee: { sx: 79, sy: 0, w: 37, h: 43, frames: 1 },
 enemy_ship: { sx: 116, sy: 0, w: 42, h: 43, frames: 1 },
 enemy_circle: { sx: 158, sy: 0, w: 32, h: 33, frames: 1 },
 explosion: { sx: 0, sy: 64, w: 64, h: 64, frames: 12 },
 enemy_missile: { sx: 9, sy: 42, w: 3, h: 20, frame: 1, }
};

var enemies = {
  straight: { x: 0,   y: -50, sprite: 'enemy_ship', health: 10, 
              E: 100 },
  ltr:      { x: 0,   y: -100, sprite: 'enemy_purple', health: 10, 
              B: 75, C: 1, E: 100, missiles: 2  },
  circle:   { x: 250,   y: -50, sprite: 'enemy_circle', health: 10, 
              A: 0,  B: -100, C: 1, E: 20, F: 100, G: 1, H: Math.PI/2 },
  wiggle:   { x: 100, y: -50, sprite: 'enemy_bee', health: 20, 
              B: 50, C: 4, E: 100, firePercentage: 0.001, missiles: 2 },
  step:     { x: 0,   y: -50, sprite: 'enemy_circle', health: 10,
              B: 150, C: 1.2, E: 75 }
};

var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

var startGame = function() {
  var ua = navigator.userAgent.toLowerCase();

  // Only 1 row of stars on Android
  if(ua.match(/android/)) {
    Game.setBoard(0,new Starfield(50,0.6,100,true));
  } else {
    Game.setBoard(0,new Starfield(20,0.4,100,true));
    Game.setBoard(1,new Starfield(50,0.6,100));
    Game.setBoard(2,new Starfield(100,1.0,50));
  }  
  var titleOverlay = document.getElementById('title-screen-overlay');
  if(titleOverlay) {
    titleOverlay.classList.remove('hidden');
    titleOverlay.classList.add('flex');
  }
};

var level1 = [
 // Start,   End, Gap,  Type,   Override
  [ 0,      4000,  500, 'step' ],
  [ 6000,   13000, 800, 'ltr' ],
  [ 10000,  16000, 400, 'circle' ],
  [ 17800,  20000, 500, 'straight', { x: 50 } ],
  [ 18200,  20000, 500, 'straight', { x: 90 } ],
  [ 18200,  20000, 500, 'straight', { x: 10 } ],
  [ 22000,  25000, 400, 'wiggle', { x: 150 }],
  [ 22000,  25000, 400, 'wiggle', { x: 100 }]
];



var playGame = function() {
  // Hide game over overlay if visible
  var overlay = document.getElementById('game-over-overlay');
  if(overlay) overlay.classList.remove('visible');

  // Reset lives
  Game.lives = Game.maxLives;
  Game.points = 0;

  var board = new GameBoard();
  board.add(new PlayerShip());
  board.add(new Level(level1,winGame));
  Game.setBoard(3,board);
  Game.setBoard(5,new GamePoints(0));
  Game.setBoard(6, Game.screenFlash);
};

var winGame = function() {
  Game.setBoard(3,new TitleScreen("You win!", 
                                  "Press fire to play again",
                                  playGame));
};

var loseGame = function() {
  // Show the beautiful Game Over overlay
  var overlay = document.getElementById('game-over-overlay');
  var scoreEl = document.getElementById('game-over-score');
  
  if(overlay && scoreEl) {
    // Format score with leading zeros
    var scoreStr = "" + Game.points;
    while(scoreStr.length < 8) scoreStr = "0" + scoreStr;
    scoreEl.textContent = scoreStr;
    overlay.classList.add('visible');
  }

  // Clear game board but keep starfield running
  Game.setBoard(3, {
    step: function() {},
    draw: function() {}
  });
  Game.setBoard(5, null);
  Game.setBoard(6, null);
};

// Button handlers
document.addEventListener('DOMContentLoaded', function() {
  var retryBtn = document.getElementById('game-over-retry');
  if(retryBtn) {
    retryBtn.addEventListener('click', function() {
      playGame();
    });
  }

  var startBtn = document.getElementById('title-btn-start');
  if(startBtn) {
    startBtn.addEventListener('click', function() {
      AudioSystem.init();
      var titleOverlay = document.getElementById('title-screen-overlay');
      if(titleOverlay) {
        titleOverlay.classList.add('hidden');
        titleOverlay.classList.remove('flex');
      }
      playGame();
    });
  }

  var muteBtn = document.getElementById('btn-mute');
  if(muteBtn) {
    muteBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    muteBtn.addEventListener('click', function() {
      var isMuted = AudioSystem.toggleMute();
      document.getElementById('icon-speaker-on').classList.toggle('hidden', isMuted);
      document.getElementById('icon-speaker-off').classList.toggle('hidden', !isMuted);
    });
  }
});


// =============================================
// STARFIELD — fills the full dynamic game area
// =============================================
var Starfield = function(speed,opacity,numStars,clear) {

  // Set up the offscreen canvas matching current game dimensions
  var stars = document.createElement("canvas");
  stars.width = Game.width; 
  stars.height = Game.height;
  var starCtx = stars.getContext("2d");

  var offset = 0;

  // If the clear option is set, 
  // make the background black instead of transparent
  if(clear) {
    starCtx.fillStyle = "#000";
    starCtx.fillRect(0,0,stars.width,stars.height);
  }

  // Scale star count proportionally to the area
  var areaRatio = (Game.width * Game.height) / (320 * 480);
  var scaledStars = Math.ceil(numStars * areaRatio);

  // Now draw a bunch of random 2 pixel
  // rectangles onto the offscreen canvas
  starCtx.fillStyle = "#FFF";
  starCtx.globalAlpha = opacity;
  for(var i=0;i<scaledStars;i++) {
    starCtx.fillRect(Math.floor(Math.random()*stars.width),
                     Math.floor(Math.random()*stars.height),
                     2,
                     2);
  }

  // This method is called every frame
  // to draw the starfield onto the canvas
  this.draw = function(ctx) {
    var intOffset = Math.floor(offset);
    var remaining = stars.height - intOffset;

    // Draw the top half of the starfield
    if(intOffset > 0) {
      ctx.drawImage(stars,
                0, remaining,
                stars.width, intOffset,
                0, 0,
                stars.width, intOffset);
    }

    // Draw the bottom half of the starfield
    if(remaining > 0) {
      ctx.drawImage(stars,
              0, 0,
              stars.width, remaining,
              0, intOffset,
              stars.width, remaining);
    }
  };

  // This method is called to update
  // the starfield
  this.step = function(dt) {
    offset += dt * speed;
    offset = offset % stars.height;
  };
};

// =============================================
// PLAYER SHIP - with lives, invincibility, and damage effects
// =============================================
var PlayerShip = function() { 
  this.setup('ship', { vx: 0, reloadTime: 0.25, maxVel: 200 });

  this.reload = this.reloadTime;
  this.x = Game.width/2 - this.w / 2;
  this.y = Game.height - Game.playerOffset - this.h;

  // Invincibility system
  this.invincible = false;
  this.invincibleTimer = 0;
  this.invincibleDuration = 2.0; // 2 seconds of invincibility after hit
  this.blinkTimer = 0;
  this.visible = true;

  this.step = function(dt) {
    if(Game.keys['left']) { this.vx = -this.maxVel; }
    else if(Game.keys['right']) { this.vx = this.maxVel; }
    else { this.vx = 0; }

    this.x += this.vx * dt;

    if(this.x < 0) { this.x = 0; }
    else if(this.x > Game.width - this.w) { 
      this.x = Game.width - this.w;
    }

    this.reload-=dt;
    if(Game.keys['fire'] && this.reload < 0) {
      Game.keys['fire'] = false;
      this.reload = this.reloadTime;

      this.board.add(new PlayerMissile(this.x,this.y+this.h/2));
      this.board.add(new PlayerMissile(this.x+this.w,this.y+this.h/2));
      
      AudioSystem.playShoot();
    }

    // Handle invincibility timer
    if(this.invincible) {
      this.invincibleTimer -= dt;
      this.blinkTimer += dt;
      
      // Blink effect - toggle visibility rapidly
      if(this.blinkTimer > 0.08) {
        this.visible = !this.visible;
        this.blinkTimer = 0;
      }

      if(this.invincibleTimer <= 0) {
        this.invincible = false;
        this.visible = true;
      }
    }
  };

  this.draw = function(ctx) {
    if(!this.visible) return;
    
    // If invincible, draw with reduced opacity and a shield glow
    if(this.invincible) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
      
      // Shield glow effect
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(Date.now() / 100);
      ctx.fillStyle = '#6ec6ff';
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
    }
  };
};

PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function(damage) {
  // If invincible, ignore hit
  if(this.invincible) return;

  Game.lives--;
  AudioSystem.playLifeLost();

  // Trigger screen flash
  if(Game.screenFlash) {
    Game.screenFlash.trigger();
  }

  // Spawn explosion at player position
  this.board.add(new Explosion(this.x + this.w/2, this.y + this.h/2));

  if(Game.lives <= 0) {
    // All lives lost - game over
    if(this.board.remove(this)) {
      loseGame();
    }
  } else {
    // Still has lives — become invincible
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.blinkTimer = 0;
    this.visible = true;
  }
};


var PlayerMissile = function(x,y) {
  this.setup('missile',{ vy: -700, damage: 10 });
  this.x = x - this.w/2;
  this.y = y - this.h; 
};

PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt)  {
  this.y += this.vy * dt;
  var collision = this.board.collide(this,OBJECT_ENEMY);
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  } else if(this.y < -this.h) { 
      this.board.remove(this); 
  }
};


var Enemy = function(blueprint,override) {
  this.merge(this.baseParameters);
  this.setup(blueprint.sprite,blueprint);
  this.merge(override);

  // Scale x position relative to dynamic game width
  // Original positions were designed for 320px width
  // Center enemies within the full playable width
  if(this.x !== undefined) {
    var centerOffset = (Game.width - 320) / 2;
    this.x = this.x + centerOffset;
  }
};

Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;

Enemy.prototype.baseParameters = { A: 0, B: 0, C: 0, D: 0, 
                                   E: 0, F: 0, G: 0, H: 0,
                                   t: 0, reloadTime: 0.75, 
                                   reload: 0 };

Enemy.prototype.step = function(dt) {
  this.t += dt;

  this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
  this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);

  this.x += this.vx * dt;
  this.y += this.vy * dt;

  var collision = this.board.collide(this,OBJECT_PLAYER);
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  }

  if(Math.random() < 0.01 && this.reload <= 0) {
    this.reload = this.reloadTime;
    if(this.missiles == 2) {
      this.board.add(new EnemyMissile(this.x+this.w-2,this.y+this.h));
      this.board.add(new EnemyMissile(this.x+2,this.y+this.h));
    } else {
      this.board.add(new EnemyMissile(this.x+this.w/2,this.y+this.h));
    }

  }
  this.reload-=dt;

  if(this.y > Game.height ||
     this.x < -this.w ||
     this.x > Game.width) {
       this.board.remove(this);
  }
};

Enemy.prototype.hit = function(damage) {
  this.health -= damage;
  if(this.health <=0) {
    if(this.board.remove(this)) {
      Game.points += this.points || 100;
      this.board.add(new Explosion(this.x + this.w/2, 
                                   this.y + this.h/2));
    }
  }
};

var EnemyMissile = function(x,y) {
  this.setup('enemy_missile',{ vy: 200, damage: 10 });
  this.x = x - this.w/2;
  this.y = y;
};

EnemyMissile.prototype = new Sprite();
EnemyMissile.prototype.type = OBJECT_ENEMY_PROJECTILE;

EnemyMissile.prototype.step = function(dt)  {
  this.y += this.vy * dt;
  var collision = this.board.collide(this,OBJECT_PLAYER);
  if(collision) {
    collision.hit(this.damage);
    this.board.remove(this);
  } else if(this.y > Game.height) {
      this.board.remove(this); 
  }
};



var Explosion = function(centerX,centerY) {
  this.setup('explosion', { frame: 0 });
  this.x = centerX - this.w/2;
  this.y = centerY - this.h/2;
  AudioSystem.playExplosion();
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
  this.frame++;
  if(this.frame >= 12) {
    this.board.remove(this);
  }
};

window.addEventListener("load", function() {
  Game.initialize("game",sprites,startGame);
});

// Click ripple animation
document.addEventListener('mousedown', function(e) {
  var ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top = e.clientY + 'px';
  document.body.appendChild(ripple);
  
  // Remove element after animation (0.25s)
  setTimeout(function() {
    ripple.remove();
  }, 250);
});
