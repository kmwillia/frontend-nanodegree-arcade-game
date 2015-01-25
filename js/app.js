//Global vars
var TO_RADIANS = Math.PI / 180,
    tileHeight = 83,
    tileWidth = 101,
    tileFullHeight = 171,
    vertOffset = 54 / 2,
    numRows = 6,
    numCols = Math.max(Math.floor(window.innerWidth / tileWidth) - 2, 5),
    windowScale = numCols / 5,
    collTypes = [
        {type: 'star', sprite: 'images/star.png', value: 25},
        {type: 'gem', sprite: 'images/gem blue.png', value: 5},
        {type: 'gem', sprite: 'images/gem green.png', value: 5},
        {type: 'gem', sprite: 'images/gem orange.png', value: 5}
    ],
    charSelectImages = [
        {sprite:'images/char-boy.png',bounds:[]},
        {sprite:'images/char-cat-girl.png',bounds:[]},
        {sprite:'images/char-horn-girl.png',bounds:[]},
        {sprite:'images/char-pink-girl.png',bounds:[]},
        {sprite:'images/char-princess-girl.png',bounds:[]}
    ],
    startButtonBounds = [];


/* SuperClass for Entities (Player, Enemies, Items, etc.)
 */
var Entity = function() {
    //Possibly include some general attributes
}

/* Determine Entity's hitbox
 * @return {Array} [x, y, width, height]
 */
Entity.prototype.bounds = function() {
    return [
        this.x + tileWidth / 4,
        this.y + tileHeight + vertOffset * 1.5,
        tileWidth / 2,
        vertOffset
    ];
}

/* Draw the Entity to the Canvas
 */
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    // ctx.fillStyle = this.hitboxColor || "rgba(255, 0, 0, 0.3)";
    // ctx.fillRect.apply(ctx, this.bounds());
}


////////////////////////////////////////////////////////////////////////////////
//                                 ENEMIES                                    //
////////////////////////////////////////////////////////////////////////////////
/* Enemy SuperClass, SubClass of Entity
 */
var Enemy = function() {
}
Enemy.prototype = new Entity();
Enemy.prototype.constructor = Enemy;

/* Set/Reset enemies speed based on params, or defaults
 * @params {Number} minX minimum X speed
 * @params {Number} maxX maximum X speed
 * @params {Number} minY minimum y speed
 * @params {Number} maxY maximum y speed
 */
Enemy.prototype.initSpeed = function(minX, maxX, minY, maxY) {
    // X speed has a default range of 100 - 300
    this.vX = Math.random() * ((maxX - minX) || 200) + (minX || 100);
    this.vY = 0;
}

/* Set/Reset the location of the enemy
 * Starts on a random row (1-3), and in a random column
 */
Enemy.prototype.initLoc = function() {

    // Pick a random row from 1 to 3, set Y to it
    this.row = Math.floor(Math.random() * 3) + 1;
    this.y = this.row * tileHeight - vertOffset;

    // Set X to random value if this is the first time through,
    // otherwise we're 'wrapping' the enemy so set it to negative tileWidth
    this.x = this.x ? -tileWidth : this.x = Math.floor(Math.random() * numCols - 1) * tileWidth;
}

/* Update the enemy's position, required method for game
* @params {Number} dt - delta time between ticks
*/
Enemy.prototype.update = function(dt) {

    if(this.x < numCols * tileWidth) {
        // The enemy is still on the screen, update its position
        // multiplying its speed by dt to account for different
        // timing on different computers
        this.x += this.vX * dt;
    } else {
        // The enemy is off the screen, move back to the start,
        // but possibly in a different row
        this.initLoc();
    }
}


/* Insect Enemy our player must avoid, SubClass of Entity
 */
var Insect = function() {

    this.sprite = 'images/enemy-bug.png';
    this.hitboxColor = 'rgba(0, 0, 255, 0.3)';

    // Select a random row for our enemy to spawn on
    this.initLoc();

    // the enemy's base speed and direction,
    // a positive(to the right) random Integer between 100 and 300
    this.initSpeed(100, 300);
}
Insect.prototype = new Enemy();
Insect.prototype.constructor = Insect;


/* Boulder Enemy
 */
var Boulder = function() {
    this.sprite = 'images/rock.png';
    this.hitboxColor = 'rgba(0, 0, 255, 0.3)';

    // Select a random row for our enemy to spawn on
    this.initLoc();

    // the enemy's base speed and direction,
    // a positive(to the right) random Integer between 100 and 300
    this.initSpeed(100, 150);
}
Boulder.prototype = new Enemy();
Boulder.prototype.constructor = Boulder;

Boulder.prototype.update = function(dt) {
    if(this.x < (numCols + 1) * tileWidth) {
        // The enemy is still on the screen, update its position
        // multiplying its speed by dt to account for different
        // timing on different computers
        this.x += this.vX * dt;
        this.y += Math.sin(this.x / 32) / 3;
    } else {
        // The enemy is off the screen, move back to the start,
        // but possibly in a different row
        this.initLoc();
    }
}

//For now, they're magic floating Boulders,
//TODO Add rotating to boulder
Boulder.prototype.render = function() {

    ctx.save();
    // Move origin to center of the boulder, rotate, and draw
    ctx.translate(this.x + tileWidth / 2, this.y + tileHeight + vertOffset);
    ctx.rotate(this.x % 360 * TO_RADIANS);
    ctx.drawImage(Resources.get(this.sprite), -tileWidth / 2, -tileFullHeight / 2 - vertOffset);
    // Restore origin
    ctx.restore();

    // ctx.fillStyle = this.hitboxColor || "rgba(255, 0, 0, 0.3)";
    // ctx.fillRect.apply(ctx, this.bounds());
}


////////////////////////////////////////////////////////////////////////////////
//                                  PLAYER                                    //
////////////////////////////////////////////////////////////////////////////////
/* Our player has Class too, is a SubClass of Entity
 */
var Player = function() {

    this.sprite = 'images/char-horn-girl.png';
    this.hitboxColor = 'rgba(0, 255, 0, 0.3)';

    // Set initial row and column, these will be used in place of conventional
    // X and Y coordinated
    this.startPosition();

    // Initialise player X and Y
    this.update();
}
Player.prototype = new Entity();
Player.prototype.constructor = Player;

/* Put the player at their start position
 * Used at the beginning of new levels
 */
Player.prototype.startPosition = function() {

    this.row = numRows - 1;
    this.col = Math.floor(numCols / 2);
}

/* Update the player's x and y coords based on its tile coords
 */
Player.prototype.update = function() {

    this.x = this.col * tileWidth;
    this.y = this.row * tileHeight - vertOffset;
}

/* Handle user input, and update player's tile location
 * @params {String} key - name of keypress captured
 */
Player.prototype.handleInput = function(key) {

    // Don't do anything if we're in the menu/other
    if(game.state === 'play') {
        //Only update the row/column if it is in bounds
        if(key == 'up') {
            this.row = Math.max(this.row - 1, 0);
            if(game.level.winningRows[this.row]) {
                game.nextLevel();
            }
        } else if(key == 'down') {
            this.row = Math.min(this.row + 1, numRows - 1);
        } else if(key == 'left') {
            this.col = Math.max(this.col - 1, 0);
        } else if(key == 'right') {
            this.col = Math.min(this.col + 1, numCols - 1);
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
//                               COLLECTIBLES                                 //
////////////////////////////////////////////////////////////////////////////////
/* Collectibles Class, SubClass of Entity
 */
var Collectible = function() {
    // Determine what type of collectible this is
    var collectible = collTypes[Math.floor(Math.random() * collTypes.length)];
    this.sprite = collectible.sprite;
    this.scale = 0.5;
    this.value = collectible.value;
    this.type = collectible.type;
    this.collected = null;
    this.animationFrame = Math.floor(Math.random() * 900);
    this.hitboxColor = 'rgba(255, 255, 0, 0.3)';

    // Determine position of collectible
    // Like Player, collectibles use tile coords
    this.row = Math.floor(Math.random() * (numRows - 3) || 0) + 1;
    this.col = Math.floor(Math.random() * numCols);

    // Update x and y coords
    this.update();
}
Collectible.prototype = new Entity();
Collectible.prototype.constructor = Collectible;

/* Update the X and Y coords of the collectible, based on tile coords
 * Increment the animationFrame
 */
Collectible.prototype.update = function() {
    if(this.collected instanceof Player) {
        // Add value to score, and remove item
        game.score += this.value;
        game.level.collectibles.splice(game.level.collectibles.indexOf(this), 1);
    } else if(this.collected instanceof Boulder) {
        // Remove if collided with a Boulder
        game.level.collectibles.splice(game.level.collectibles.indexOf(this), 1);
    } else {
        // Update x, y locations, height, width, and animation
        this.x = this.col * tileWidth;
        this.y = this.row * tileHeight - vertOffset;
        this.width = tileWidth * this.scale;
        this.height = tileFullHeight * this.scale;
        this.animationFrame++;
    }
}

/* Collectibles have a special render,
 * Includes scaling and bobbing
 */
Collectible.prototype.render = function() {

    // Draw Collectible, full with bobbing
    ctx.drawImage(
        Resources.get(this.sprite),
        this.x + this.width / 2,
        this.y + this.height / 2 + Math.sin(this.animationFrame / 10) * 3,
        this.width,
        this.height
    );

    // Hitbox
    // ctx.fillStyle = this.hitboxColor;
    // ctx.fillRect.apply(ctx, this.bounds());
}


////////////////////////////////////////////////////////////////////////////////
//                               GAME & LEVELS                                //
////////////////////////////////////////////////////////////////////////////////
/* Game Class, contains Player, Level, and game states
 */
var Game = function() {

    this.player = new Player();
    this.level = new Level(0);
    this.score = 0;
    this.state = 'menu';
}

/* Advance to the next level
 */
Game.prototype.nextLevel = function() {

    this.level = new Level(this.level.level + 1);
    this.player.startPosition();
}

/* Level Class, contains level states, enemies, and collectibles
 */
var Level = function(level) {

    this.level = level;
    this.enemies = this.spawnEnemies();
    this.collectibles = this.spawnCollectibles();
    //Maybe sometime later, different levels can have different winning rows
    this.winningRows = {0: true};
}

/* Creates new enemies for the current level
 * the number of enemies scales with the number of columns in the game
 * so the game should feel similar no matter how many columns
 */
Level.prototype.spawnEnemies = function() {

    // Number of enemies should scale with game size & level
    var numEnemies = 5 * (1 + this.level / 10) * windowScale,
        newEnemies = [];
    for(var i = 0; i < numEnemies; i++) {
        if(this.level <= 5) {
            //Levels 1 - 5 are all Insects
            newEnemies.push(new Insect());
        } else if (this.level <= 10) {
            //Levels 6 - 10 are 80% Insects, 20% Other
            newEnemies.push(Math.random() < 0.2 ? new Boulder() : new Insect());
        } else {
            //Levels 11+ are 50% Insects, 50% Other
            newEnemies.push(Math.random() < 0.5 ? new Boulder() : new Insect());
        }
    }
    return newEnemies;
}

/* Creates new collectibles for the current level
 * the number of collectibles scales with the number of columns in the game
 */
Level.prototype.spawnCollectibles = function() {

    var newCollectibles = [];
    // Scale with window size
    for(var i = 0; i < 2 * windowScale; i++) {
        newCollectibles.push(new Collectible());
    }
    return newCollectibles;
}


////////////////////////////////////////////////////////////////////////////////
//                             LISTENERS & LOGIC                              //
////////////////////////////////////////////////////////////////////////////////

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    game.player.handleInput(allowedKeys[e.keyCode]);
});

// Listen for clicks when in the menu
document.addEventListener('click', function(e) {
    if( game.state === 'menu' &&
        e.target.tagName.toUpperCase() == 'CANVAS' &&
        e.target.getContext('2d') == ctx) {

        //Get Click's bounds
        var bounds = [e.offsetX, e.offsetY, 0, 0];

        //Check against Start button
        if(collides(bounds, startButtonBounds)) {
            game.state = 'play';
        } else {
            charSelectImages.forEach(function(image) {
                if(collides(bounds,image.bounds)) {
                    game.player.sprite = image.sprite;
                }
            });
        }

    }
});

// Add logic after window is fully loaded
window.addEventListener('load', function(e) {
    // Change character's image whenever one
    // of the selection images is selected
    var imgs = document.querySelectorAll('img');
    for(var i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('click', function(e) {
            game.player.changeCharacter(e.srcElement.attributes.src.value);
        })
    }
});


/* Simple collision detection. Check if bounds1 and bounds2 collide
* @params {Array} boundsOne [x, y, width, height]
* @params {Array} boundsTwo [x, y, width, height]
* @returns {Boolean} true if collide, else false
*/
function collides(boundsOne, boundsTwo) {
    return !(
        boundsOne[0] > boundsTwo[0] + boundsTwo[2] ||
        boundsOne[0] + boundsOne[2] < boundsTwo[0] ||
        boundsOne[1] > boundsTwo[1] + boundsTwo[3] ||
        boundsOne[1] + boundsOne[3] < boundsTwo[1]
    );
}

// Create a new game
var game = new Game();
