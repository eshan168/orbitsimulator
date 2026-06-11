const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const tools = document.getElementById("tools");
const debug = document.getElementById("debug");

let center = [canvas.width/2,canvas.height/2];
let mousefocus = [[canvas.width/2,canvas.height/2]]

paused = false;

function animate() {
    clearCanvas();
    updatezoom();

    if (!paused) {
        for (let i = 0; i < extraSteps; i++){
            bodies.forEach((body) => body.updatePosition());

            for (let i=0; i<bodies.length-1; i++) {
                for (let j=i+1; j<bodies.length; j++){
                    Gravity.calculateAcceleration(bodies[i],bodies[j]);
                }
            }

            bodies.forEach((body) => body.updateVelocity());
            // console.log(Gravity.scaledDistance(mercury,sun));
        }
    }

    focus();
    center = getCenter();
    
    Body.updateAlltrails(bodies);
    bodies.forEach((body) => body.draw());

    requestAnimationFrame(animate);
}

function updatezoom() {
    if (currentzoom != 1){
        let widthtranslation = currentzoom > 1 ? -mousefocus[0] * 1/11: mousefocus[0] * 1/9;
        let heighttranslation = currentzoom > 1 ? -mousefocus[1] * 1/11: mousefocus[1] * 1/9;

        ctx.scale(currentzoom,currentzoom);
        ctx.translate(widthtranslation,heighttranslation)
        currentzoom = 1;
    }
}

let sun = new Body({name:"sun", radius:1.392/2, mass:1.989 * 10**30, position:[400,300], vector:[0,0], color:"#FCD80F"});
let mercury = new Body({name:"mercury", radius:0.004881/2, mass:3.3010 * 10**23, position:[354,300], vector:[0,58980], color:"#aa9999"});
let venus = new Body({name:"venus", radius:0.0121036/2, mass:4.8673 * 10**24, position:[292.52,300], vector:[0,35260], color:"#ffcd68"});
let earth = new Body({name:"earth", radius:0.0121036/2, mass:5.972 * 10**24, position:[247.9,300], vector:[0,29290], color:"#0085d1"});
let moon = new Body({name:"moon", radius:0.003475/2, mass:7.35 * 10**22, position:[247.495,300], vector:[0,30313.1], color:"#8d8d8d"});
let mars = new Body({name:"mars", radius:0.0067924/2, mass:6.4169 * 10**23, position:[193.35,300], vector:[0,26500], color:"#e96900"});
let jupiter = new Body({name:"jupiter",radius:0.142984/2,mass:1.89813 * 10**27,position:[-340.595,300], vector:[0,13720], color:"#844800"});
let ganymede = new Body({name:"ganymede", radius:0.0052682/2, mass:1.4819 * 10**23, position:[-341.6642,300], vector:[0,24600], color:"#8f9596"});
let europa = new Body({name:"europa", radius:0.0031216/2, mass:4.79984 * 10**22, position:[-341.259862,300], vector:[0,27464], color:"#85a5a9"});
let saturn = new Body({name:"saturn", radius:0.120536/2, mass:5.6851 * 10**26, position:[-957.554,300], vector:[0,10140], color:"#fff1a5"});
let uranus = new Body({name:"uranus", radius:0.051118/2, mass:8.6849 * 10**25, position:[-2332.696,300], vector:[0,7300], color:"#a6fff6"});
let neptune = new Body({name:"neptune", radius:0.049528/2, mass:1.0244 * 10**26, position:[-4071.05,300], vector:[0,5470], color:"#3324ba"});
let triton = new Body({name:"triton", radius:0.0027068/2, mass:2.1389 * 10**22, position:[-4071.404759,300], vector:[0,9860], color:"#7b8d7a"});
let planet = new Body({name:"planet", radius:0.5, mass:5 * 10**29, position:[400,-400], vector:[8000,0], color:"#ef5c42"});

let bodies = [sun,mercury,venus,earth,moon,mars,jupiter,ganymede,europa,saturn,uranus,neptune,triton,planet];
// let bodies = [sun,mercury];
let keys = bodies.map(b => b.name);
let keysToBodies = Object.fromEntries(bodies.map(b => [b.name, b]));

// Initial calculations of acceleration
for (let i=0; i<bodies.length-1; i++) {
    for (let j=i+1; j<bodies.length; j++){
        Gravity.calculateAcceleration(bodies[i],bodies[j]);
    }
}

Body.deleteBody(earth);

// Make canvas full size and center orbits
ctx.canvas.width  = window.innerWidth*0.8;
ctx.canvas.height = window.innerHeight;
ctx.translate(window.innerWidth*0.4-center[0],window.innerHeight*0.5-center[1]);

window.addEventListener('load', function() {
    animate();
})