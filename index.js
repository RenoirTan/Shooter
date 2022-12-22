var ready = false;
var intervalId = undefined;
var gameOver = false;
var player = undefined;
var canvas = undefined;
var context = undefined;
var particles = [];
var projectiles = [];
var enemies = [];
var ticks = 0;
var frame = 0;
var score = 0;

class Entity {
    draw(context) {
        console.error("Entity.draw(context) unimplemented");
    }

    update() {
        console.error("Entity.update() unimplemented");
    }
}

class DisposableEntity extends Entity {
    isGarbage(canvas) {
        return this.x < -this.radius
            || this.y < -this.radius
            || this.x > canvas.width + this.radius
            || this.y > canvas.height + this.radius;
    }
}

class Particle extends DisposableEntity {
    constructor(x, y, radius, color, velocity, angle) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.style = `hsl(${this.color}, 80%, 80%)`;
        this.alpha = 1;
        this.velocity = velocity;
        this.angle = angle;
        this.aliveSinceFrame = frame;
    }

    draw(context) {
        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.style;
        context.fill();
        context.restore();
    }

    update() {
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
        gsap.to(this, {
            velocity: this.velocity*0.6,
            alpha: this.alpha*0.5
        });
    }

    isGarbage(canvas) {
        return super.isGarbage(canvas) || (frame-this.aliveSinceFrame) > 25;
    }
}

class Player extends Entity {
    constructor(x, y, radius, color) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
    }
}

class Projectile extends DisposableEntity {
    constructor(x, y, radius, color, velocity, angle) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.angle = angle;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
    }

    update() {
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
    }
}

class Enemy extends DisposableEntity {
    constructor(x, y, radius, color, velocity, angle) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.health = radius;
        this.color = color;
        this.style = `hsl(${this.color}, 50%, 50%)`
        this.velocity = velocity;
        this.angle = angle;
        this.deadSinceFrame = null;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.style;
        context.fill();
    }

    update() {
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;
    }

    isGarbage(canvas) {
        return super.isGarbage(canvas)
            || (this.deadSinceFrame && frame-this.deadSinceFrame > 1);
    }

    hit() {
        if (this.health < 20) {
            score += Math.floor(this.health);
            this.die();
        } else {
            score += 10;
            this.health -= 10;
            gsap.to(this, {
                radius: this.health
            });
        }
        for (let i = 0; i < randInt(5, 10)*this.radius/10; i++) {
            const particle = new Particle(
                this.x,
                this.y,
                Math.random()*this.radius/10 + 2,
                this.color,
                10,
                (2*Math.random()-1) * Math.PI
            );
            particles.push(particle);
        }
    }

    die() {
        this.style = `hsl(${this.color}, 20%, 50%)`;
        this.velocity = 0.1;
        this.deadSinceFrame = frame;
    }
}

const calcAngle = (x1, y1, x2, y2) => {
    return Math.atan2(y2-y1, x2-x1)
};

const randInt = (low, high) => {
    return Math.floor(Math.random() * (high-low+1)) + low;
};

const circleCollision = (xDiff, yDiff, radiusTotal) => {
    // shitty pythagoras
    return (xDiff*xDiff + yDiff*yDiff) <= radiusTotal*radiusTotal;
};

const spawnEnemy = () => {
    const spawnEnemyHorizontal = (radius, velocity, color) => {
        const y = randInt(1-radius, canvas.height+radius-1);
        const x = (Math.random() > 0.5)
            ? canvas.width+radius-1
            : 1-radius;
        const angle = calcAngle(x, y, player.x, player.y);
        return new Enemy(x, y, radius, color, velocity, angle);
    };

    const spawnEnemyVertical = (radius, velocity, color) => {
        const x = randInt(1 - radius, canvas.width + radius - 1);
        const y = (Math.random() > 0.5)
            ? canvas.height + radius - 1
            : 1 - radius;
        const angle = calcAngle(x, y, player.x, player.y);
        return new Enemy(x, y, radius, color, velocity, angle);
    };

    if (enemies.length >= 20) {
        return;
    }
    const radius = randInt(10, 50);
    const velocity = Math.random()/2 + 0.5;
    const color = randInt(0, 359);
    enemies.push(
        (Math.random() > 0.5)
            ? spawnEnemyHorizontal(radius, velocity, color)
            : spawnEnemyVertical(radius, velocity, color)
    );
};

const removeItems = (list, garbageList) => {
    let count = 0;
    garbageList.forEach((index) => {
        list.splice(index - count, 1);
        count += 1;
    });
};

const updateItem = (item, index, canvas, context, garbageList) => {
    item.draw(context);
    item.update();
    if (item.isGarbage(canvas)) {
        garbageList.push(index);
    }
};

const animate = () => {
    frame += 1;

    context.fillStyle = "rgba(0, 0, 0, 0.1)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const garbageParticles = [];
    const garbageProjectiles = [];
    const garbageEnemies = [];

    // detect collision with projectile
    enemies.forEach((e) => {
        if (
            circleCollision(player.x-e.x, player.y-e.y, player.radius+e.radius)
            && !e.deadSinceFrame
        ) {
            gameOver = true;
        }
        projectiles.forEach((p, pIndex) => {
            if (circleCollision(e.x-p.x, e.y-p.y, e.radius+p.radius) && !e.deadSinceFrame) {
                e.hit();
                garbageProjectiles.push(pIndex);
            }
        });
    });
    enemies.forEach((e, index) => {
        e.draw(context);
        e.update();
        if (e.isGarbage(canvas)) {
            garbageEnemies.push(index);
        }
    });
    removeItems(enemies, garbageEnemies);

    projectiles.forEach((p, index) => updateItem(p, index, canvas, context, garbageProjectiles));
    removeItems(projectiles, garbageProjectiles);

    particles.forEach((p, index) => updateItem(p, index, canvas, context, garbageParticles));
    removeItems(particles, garbageParticles);

    player.draw(context);

    if (gameOver) {
        doGameOver();
    }

    // requestAnimationFrame(animate);
};

const enemySpawnChance = (score) => {
    return Math.min(0.01 + (score/1000*0.01), 0.1)
};

const report = () => {
    console.log(
        `Number of projectiles: ${projectiles.length}\nNumber of enemies: ${enemies.length}`
    );
};

const interval = () => {
    if (ticks === 50) {
        ticks = 0;
    }
    animate();
    let esc = enemySpawnChance(score);
    $("#framecounter").html(`${frame}`);
    $("#enemyspawnchance").html(`${esc}`);
    $("#scorecounter").html(`${score}`);
    if (Math.random() <= esc) {
        spawnEnemy();
    }
    ticks += 1;
};

const resetGameState = () => {
    ready = false;
    intervalId = undefined;
    gameOver = false;
    player = undefined;
    canvas = undefined;
    context = undefined;
    particles = [];
    projectiles = [];
    enemies = [];
    ticks = 0;
    frame = 0;
    score = 0;
};

const initCanvas = (canvas) => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
};

const initGame = () => {
    console.log("initGame() called");

    resetGameState();

    $("#startgame").hide();
    $("#data").show();
    $("#scorecounter").html("0");
    $("#scorecount").show();

    canvas = $("#gamecanvas").get(0);
    initCanvas(canvas);
    context = canvas.getContext("2d");

    player = new Player(canvas.width/2, canvas.height/2, 30, "white");
    ready = true;
    
    intervalId = setInterval(interval, 20);
};

const doGameOver = () => {
    clearInterval(intervalId);
    context.clearRect(0, 0, canvas.width, canvas.height);
    $("#startgame").show();
    $("#bigscorecounter").html(`${score}`);
    $("#scorecount").hide();
};

const shoot = (event) => {
    if (!ready) {
        return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const angle = calcAngle(player.x, player.y, mouseX, mouseY);
    const projectile = new Projectile(player.x, player.y, 5, "white", 5, angle);
    projectiles.push(projectile);
};

const main = () => {
    console.log("index.js loaded");
    $("#startbutton").click(initGame);
};

$(document).ready(main);
$(window).click(shoot);
window.onkeydown = (event) => {
    // spacebar
    if (event.keyCode === 32) {
        if ($("#statsfornerds").css("display") == "none") {
            $("#statsfornerds").show();
        } else {
            $("#statsfornerds").hide();
        }
    }
};