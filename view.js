let currentzoom = 1;
let zoomscale = 1;
let zoominfactor = 1.1;
let zoomoutfactor = 0.9;

let isPressed = false;
let xstart = 0;
let ystart = 0;

const maxspeed = 5000000;
const minspeed = 125;

const focusmenu = document.getElementById("focus");
const backward = document.getElementById("backwards");
const forward = document.getElementById("forwards");
const reverse = document.getElementById("reverse");

const focusMenu = document.getElementById("focus")

window.addEventListener('load', function() {
    focusbody = null;
    changefocus();
    updateMenus();
})

addEventListener("mouseup", function(event) {
    isPressed = false;
});

addEventListener("mousedown", function(event) {
    let rect = canvas.getBoundingClientRect()
    xstart = event.clientX - rect.left;
    ystart = event.clientY - rect.top;
    isPressed = true;
});

addEventListener("keydown", function(event) {
    ctx.translate(100,100);
});

addEventListener("mousemove", function(event) {
    if (!isPressed) {
        return;
    }
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    let translatex = toScale(x-xstart);
    let translatey = toScale(y-ystart);
    ctx.translate(translatex,translatey);

    xstart = x;
    ystart = y;
});

addEventListener("wheel", function(event) {
    event.preventDefault();
    currentzoom = event.deltaY < 0 ? zoominfactor : zoomoutfactor;
    zoomscale *= currentzoom;

    bodies.forEach((body) => body.updatetext());

    let xevent = event.clientX;
    let yevent = event.clientY;
    let xoffset = xevent-(canvas.width/2);
    let yoffset = yevent-(canvas.height/2);
    let c = getCenter();
    
    mousefocus = [c[0]+xoffset/zoomscale*currentzoom,c[1]+yoffset/zoomscale*currentzoom];

}, {passive: false});

addEventListener("resize", function(event) {
    ctx.canvas.width  = window.innerWidth*0.8;
    ctx.canvas.height = window.innerHeight;
    zoomscale = 1;

    ctx.translate(window.innerWidth/2-center[0],window.innerHeight/2-center[1]);
});

focusmenu.addEventListener("change", function() {
    changefocus();
});

function reverseTime() {
    timestep *= -1;
    if (reverse.innerText == "Reverse") {
        reverse.innerText = "Forward";
    } else {
        reverse.innerText = "Reverse";
    }

    for (body of bodies) {
        body.cleartrail();
    }
}

function skipbackward() {
    if (timestep > minspeed) {
        timestep *= 0.5;
        earth.increaseLengths(bodies);
    }
}

function skipforward() {
    if (timestep < maxspeed) {
        timestep *= 2;
        earth.decreaseLengths(bodies);
    }
}

function pause() {
    paused = !paused;
}

function changefocus() {
    focusbody = keysToBodies[focusmenu.value];
    if (focusbody == null) {
        return;
    }
    
    let position = focusbody.position;
    ctx.translate(center[0]-position[0],center[1]-position[1]);
}

function changeNameVisibility() {
    for (let body of bodies) {
        body.nameVisible = !body.nameVisible
    }
}

function updateMenus() {
    focusMenu.innerHTML = "";
    for (let key of keys) {
        focusMenu.add(new Option(key));
    }
}

function focus() {
    if (focusbody == null) {
        return;
    }

    ctx.translate(focusbody.prevPostion[0]-focusbody.position[0], focusbody.prevPostion[1]-focusbody.position[1]);
}

function toScale(num) {
    return num/zoomscale;
}

function getCenter() {
    const m = ctx.getTransform();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Use DOMMatrix inverse:
    const inv = m.inverse();

    // Apply inverse transform to screen point
    const realCenter = [
        (inv.a * centerX + inv.c * centerY + inv.e),
        inv.b * centerX + inv.d * centerY + inv.f
    ];

    return realCenter;
}

function clearCanvas() {
    ctx.clearRect(-10000000,-10000000,20000000,20000000);
    // if (zoomscale < 1) {
    //     ctx.clearRect(-canvas.width/zoomscale,-canvas.height/zoomscale,canvas.width/zoomscale*2,canvas.height/zoomscale*2);
    // } else {
    //     ctx.clearRect(0,0,canvas.width,canvas.height);
    // }
}

function log(text) {
    debug.innerText = text;
}

function round(num) {
    return Math.round(num*1000)/1000;
}