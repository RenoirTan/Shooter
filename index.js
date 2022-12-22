var ready = false;
var player = undefined;
var canvas = undefined;
var context = undefined;
var projectiles = [];
var enemies = [];
var ticks = 0;
var frame = 0;

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
        console.error("DisposableEntity.isGarbage(canvas) unimplemented");
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

    isGarbage(canvas) {
        return this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height;
    }
}

class Enemy extends DisposableEntity {
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

    isGarbage(canvas) {
        return this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height;
    }
}

const calcAngle = (x1, y1, x2, y2) => {
    return Math.atan2(y2-y1, x2-x1)
}

const randInt = (low, high) => {
    return Math.floor(Math.random() * (high-low+1)) + low;
}

const spawnEnemies = () => {
    if (enemies.length >= 20) {
        return;
    }
    const azimuth = (2*Math.random() - 1) * Math.PI; // angle in polar coordinates
    const distance = Math.min(canvas.width, canvas.height) / 2;
    const x = player.x + distance * Math.cos(azimuth);
    const y = player.y + distance * Math.sin(azimuth);
    const size = randInt(10, 50);
    const velocity = Math.random()/2 + 0.5;
    const angle = calcAngle(x, y, player.x, player.y);
    const enemy = new Enemy(x, y, size, "green", velocity, angle);
    enemies.push(enemy);
}

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

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = "10px Arial";
    context.fillStyle = "white";
    context.fillText(`Frame: ${frame}`, 10, 20);

    const garbageProjectiles = [];
    projectiles.forEach((p, index) => updateItem(p, index, canvas, context, garbageProjectiles));
    removeItems(projectiles, garbageProjectiles);

    const garbageEnemies = [];
    enemies.forEach((e, index) => updateItem(e, index, canvas, context, garbageEnemies));
    removeItems(enemies, garbageEnemies);

    player.draw(context);
    // requestAnimationFrame(animate);
}

const report = () => {
    console.log(
        `Number of projectiles: ${projectiles.length}\nNumber of enemies: ${enemies.length}`
    );
}

const interval = () => {
    if (ticks === 50) {
        ticks = 0;
    }
    animate();
    if (ticks === 0) {
        spawnEnemies();
        // report();
    }
    ticks += 1;
}

const initCanvas = (canvas) => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

const initGame = () => {
    canvas = $("#gamecanvas").get(0);
    initCanvas(canvas);
    console.log(canvas);
    context = canvas.getContext("2d");

    player = new Player(canvas.width/2, canvas.height/2, 30, "blue");
    console.log(player);
    ready = true;
    
    setInterval(interval, 20);
}

const shoot = (event) => {
    if (!ready) {
        return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const angle = calcAngle(player.x, player.y, mouseX, mouseY);
    const projectile = new Projectile(player.x, player.y, 5, "red", 5, angle);
    projectiles.push(projectile);
}

const main = () => {
    console.log("index.js loaded");
    ready = true;
    initGame();
}

$(document).ready(main);
$(window).click(shoot);