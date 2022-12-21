var ready = false;
var player = undefined;
var canvas = undefined;
var context = undefined;
var projectiles = [];

class Player {
    constructor(x, y, radius, color) {
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

class Projectile {
    constructor(x, y, radius, color, velocity, angle) {
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

const removeProjectiles = (marked) => {
    let count = 0;
    marked.forEach((index) => {
        projectiles.splice(index-count, 1);
        count += 1;
    });
}

const animate = () => {
    if (ready) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const markedForRemoval = []
        projectiles.forEach((p, index) => {
            p.draw(context);
            p.update();
            if (p.isGarbage(canvas)) {
                markedForRemoval.push(index);
            }
        });
        removeProjectiles(markedForRemoval);
        player.draw(context);
    }
    // requestAnimationFrame(animate);
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
    
    setInterval(animate, 30);
}

const shoot = (event) => {
    if (!ready) {
        return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const angle = calcAngle(player.x, player.y, mouseX, mouseY);
    const projectile = new Projectile(player.x, player.y, 5, "red", 10, angle);
    projectiles.push(projectile);
}

const main = () => {
    console.log("index.js loaded");
    ready = true;
    initGame();
}

$(document).ready(main);
$(window).click(shoot);