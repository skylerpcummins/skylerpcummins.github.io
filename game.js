var StarJumpr = function() {};
StarJumpr.Play = function() {};

StarJumpr.Play.prototype = {

  //preload stuff
  preload: function() {
  	this.load.image('pixel', 'assets/pixel.png');
  	this.load.image('star', 'assets/star.png');
    this.load.image('button', 'assets/button.png');
  	this.load.spritesheet('dude', 'assets/dude.png', 32, 48);
  },

  //create stuff
  create: function() {
  	this.stage.backgroundColor = '#6bf';
    this.scoreMultiplier = 2;

    // debugger;
    this.playing = false;

    this.scaleHelper();
    this.gameComponentsHelper();
  	this.physics.startSystem(Phaser.Physics.ARCADE);
    this.cameraSetupHelper();
    this.startPlayingHelper();
  },

  startPlayingHelper: function() {
    if (!this.playing) {
      this.playButton = this.add.button(
        160,
        250,
        'button',
        this.togglePlaying,
        this
      );
    }
  },

  togglePlaying: function() {
    this.playing = true;
    this.playButton.destroy();
  },

  scaleHelper: function() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.maxWidth = this.game.width;
    this.scale.maxHeight = this.game.height;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.scale.setScreenSize(true);
  },

  cameraSetupHelper: function() {
    this.cameraYMin = 99999;
    this.platformYMin = 99999;
  },

  gameComponentsHelper: function() {
    this.scoreText = this.add.text(
      16, 16, 'Score: 0',
      { fontSize: '32px', fill: '#000' }
    );
    this.createPlatforms();
    this.createStars();
    this.createPlayer();
    this.cursors = this.input.keyboard.createCursorKeys();
  },

  //update stuff
  update: function() {
    this.physicsUpdateHelper();

    if (this.playing) {
      this.world.setBounds(
        0,
        -(this.player.yChange),
        this.world.width,
        this.game.height + this.player.yChange
      );

      this.cameraUpdateHelper();
      this.scoreUpdateHelper();

      this.movePlayer();

      this.platformUpdateHelper();
      this.starUpdateHelper();
    }
  },

  cameraUpdateHelper: function() {
    this.cameraYMin = Math.min(
      this.cameraYMin,
      Math.min(this.player.y - this.game.height + 200, 0)
    );
  	this.camera.y = this.cameraYMin;
  },

  scoreUpdateHelper: function() {
    this.scoreText.y = Math.min(this.cameraYMin, 16);
    this.score = - (Math.floor(this.cameraYMin / 10) * this.scoreMultiplier);
    this.scoreText.text = 'Score: ' + this.score;
  },

  physicsUpdateHelper: function() {
    var callback;
    this.playing ? callback = this.autoBounce.bind(this) : callback = null
    this.physics.arcade.collide(this.player, this.platforms, callback);
    this.physics.arcade.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );
  },

  platformUpdateHelper: function() {
    this.platforms.forEachAlive(function(el) {
      this.platformYMin = Math.min(this.platformYMin, el.y);
      if (el.y > this.camera.y + this.game.height) {
        el.kill();
        this.createSinglePlatform(
          Math.random() * (this.world.width - 50),
          this.platformYMin - 50, 50, 5
        );
      }
    }, this);
  },

  starUpdateHelper: function() {
    var determineCreateStar = Math.random();
    if (determineCreateStar < 0.002) { this.createSingleStar() }
  },

  //player creation stuff
  createPlayer: function() {
  	this.player = game.add.sprite(32, this.world.height - 64, 'dude');
  	this.player.anchor.set(0);

  	this.player.yOrig = this.player.y;
  	this.player.yChange = 0;

  	this.physics.arcade.enable(this.player);
    this.playerBodyHelper();
    this.playerAnimationHelper();
  },

  playerBodyHelper: function() {
    this.player.body.gravity.y = 500;
    this.player.body.collideWorldBounds = false;
    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;
  },

  playerAnimationHelper: function() {
    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);
    this.player.frame = 4;
  },

  //player moving stuff
  movePlayer: function() {
  	this.player.body.velocity.x = 0;

  	if (this.cursors.left.isDown) {
  		this.player.body.velocity.x = -200;
  		this.player.animations.play('left');
  	}
  	else if (this.cursors.right.isDown) {
  		this.player.body.velocity.x = 200;
  		this.player.animations.play('right');
  	}
  	else {
  		this.player.animations.stop();
  		this.player.frame = 4;
  	}

  	this.world.wrap(this.player, this.player.width / 2, false);
  	this.player.yChange = Math.max(
      this.player.yChange,
      Math.abs(this.player.y - this.player.yOrig)
    );

    if (this.player.y > this.cameraYMin + this.game.height && this.player.alive) {
      this.state.start('Play');
    }
  },

  autoBounce: function() {
	   this.player.body.velocity.y = Math.min(-320 - (.01 * this.camera.y), -250);
   },

   //platform creation stuff
  createPlatforms: function() {
  	this.platforms = this.add.group();
  	this.platforms.enableBody = true;
  	this.platforms.createMultiple(20, 'pixel');

  	this.createInitialPlatforms();
  },

  createInitialPlatforms: function() {
    this.createSinglePlatform(
      -16, this.world.height - 16,
      this.world.width + 16, 16
    );

  	for (var i = 0; i < 19; i++) {
  		this.createSinglePlatform(
        Math.random() * (this.world.width - 50),
        this.world.height - 50 - 50 * i, 50, 5
      );
  	}
  },

  createSinglePlatform: function(x, y, width, scaleY) {
  	var platform = this.platforms.getFirstDead();
  	platform.reset(x, y);
  	platform.scale.x = width;
  	platform.scale.y = scaleY;
  	platform.body.immovable = true;

  	return platform;
  },

  //star creation stuff
  createStars: function() {
  	this.stars = game.add.group();
  	this.stars.enableBody = true;
  },

  createSingleStar: function() {
  	var star = this.stars.create(
      Math.random() * (game.world.width),
      this.platformYMin - 50,
      'star'
    );
  	star.body.gravity.y = Math.random() * 100 + 6;

  	return star;
  },

  collectStar: function(player, star) {
  	star.kill();
  	this.scoreMultiplier += 1;
  },

  //start over
  shutdown: function() {
    this.world.setBounds(0, 0, this.game.width, this.game.height);
    this.cursors = null;
    this.player.destroy();
    this.player = null;
    this.platforms.destroy();
    this.platforms = null;
  }

}

var game = new Phaser.Game(400, 550, Phaser.CANVAS, '');
game.state.add('Play', StarJumpr.Play);
game.state.start('Play');
