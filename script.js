class Display {

    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext("2d");

        // this.bodies = [sun,mercury];
        this.bodies = [sun,mercury,venus,earth,moon,mars,jupiter,ganymede,europa,saturn,uranus,neptune,triton];
        this.keys = this.bodies.map(b => b.name);
        this.keysToBodies = Object.fromEntries(this.bodies.map(b => [b.name, b]));

        this.simulator = new VelocityVerletSim(this.bodies);
        this.rendering = new Rendering(this,this.bodies,this.keys,this.keysToBodies);
        this.timeControls = new TimeControls(this.bodies);

        this.clearAll = document.getElementById("clearAll");
        this.clearAll.addEventListener("click", () => this.clearAllBodies());
    }

    animate() {
        this.rendering.clearCanvas();
        this.rendering.viewControls.updatezoom();

        if (!this.timeControls.paused) {
            for (let i = 0; i < VelocityVerletSim.extraSteps; i++){
                this.simulator.simulateStep();
                this.bodies.forEach((body) => body.trail.updatetrail());
            }
        }
        
        this.rendering.viewControls.followFocus();
        this.rendering.drawState();

        requestAnimationFrame(() => this.animate());
    }

    createBody() {
        this.timeControls.pause();
        this.rendering.viewControls.resetViewToDefault();

        let newBody = new Body({
            name:"Test",
            radius:1,
            mass:10,
            position:[0,0],
            velocity:[0,10000],
            color:"hsl(0, 0%, 100%)"
        });

        this.keys.push(newBody.name);
        this.bodies.push(newBody);
        this.keysToBodies[newBody.name] = newBody;
        this.rendering.viewControls.adjuster.targetBody = this.bodies[this.bodies.length-1];

        this.rendering.viewControls.updateMenus();
    }

    deleteBody(body) {
        let index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
            this.keys.splice(index, 1);
            this.keysToBodies = Object.fromEntries(this.bodies.map(b => [b.name, b]));
        }
        this.simulator.bodies = this.bodies;
        this.rendering.bodies = this.bodies;
        this.rendering.viewControls.bodies = this.bodies;
        this.timeControls.bodies = this.bodies;

        this.rendering.viewControls.updateMenus();
    }

    clearAllBodies() {
        while (this.bodies.length > 0) {
            this.deleteBody(this.bodies[0]);
        }
    }
}

let sun = new Body({
    name:"Sun",
    radius:1.392,
    mass:1.989e30,
    position:[0,0],
    velocity:[0,0],
    color:"hsl(51, 98%, 52%)"
});

let mercury = new Body({
    name:"Mercury",
    radius:0.004881,
    mass:3.3010e23,
    position:[-46, 0],
    velocity:[0,58980],
    color:"hsl(0, 9%, 63%)"
});

let venus = new Body({
    name:"Venus",
    radius:0.0121036,
    mass:4.8673e24,
    position:[-107.48, 0],
    velocity:[0,35260],
    color:"hsl(40, 100%, 70%)"
});

let earth = new Body({
    name:"Earth",
    radius:0.0121036,
    mass:5.972e24,
    position:[-152.1, 0],
    velocity:[0,29290],
    color:"hsl(202, 100%, 41%)"
});

let moon = new Body({
    name:"Moon",
    radius:0.003475,
    mass:7.35e22,
    position:[-152.505, 0],
    velocity:[0,30313.1],
    color:"hsl(0, 0%, 55%)"
});

let mars = new Body({
    name:"Mars",
    radius:0.0067924,
    mass:6.4169e23,
    position:[-206.65, 0],
    velocity:[0,26500],
    color:"hsl(27, 100%, 46%)"
});

let jupiter = new Body({
    name:"Jupiter",
    radius:0.142984,
    mass:1.89813e27,
    position:[-740.595, 0],
    velocity:[0,13720],
    color:"hsl(33, 100%, 26%)"
});

let ganymede = new Body({
    name:"Ganymede",
    radius:0.0052682,
    mass:1.4819e23,
    position:[-741.6642, 0],
    velocity:[0,24600],
    color:"hsl(189, 3%, 57%)"
});

let europa = new Body({
    name:"Europa",
    radius:0.0031216,
    mass:4.79984e22,
    position:[-741.259862, 0],
    velocity:[0,27464],
    color:"hsl(187, 17%, 59%)"
});

let saturn = new Body({
    name:"Saturn",
    radius:0.120536,
    mass:5.6851e26,
    position:[-1357.554, 0],
    velocity:[0,10140],
    color:"hsl(51, 100%, 82%)"
});

let uranus = new Body({
    name:"Uranus",
    radius:0.051118,
    mass:8.6849e25,
    position:[-2732.696, 0],
    velocity:[0,7300],
    color:"hsl(174, 100%, 83%)"
});

let neptune = new Body({
    name:"Neptune",
    radius:0.049528,
    mass:1.0244e26,
    position:[-4471.05, 0],
    velocity:[0,5470],
    color:"hsl(246, 68%, 44%)"
});

let triton = new Body({
    name:"Triton",
    radius:0.0027068,
    mass:2.1389e22,
    position:[-4471.404759, 0],
    velocity:[0,9860],
    color:"hsl(117, 8%, 52%)"
});


let red_dwarf = new Body({name:"Red Dwarf", radius:0.5, mass:10**29, position:[0,-170], velocity:[-10000,0], color:"hsl(9, 84%, 60%)"});
let neutron = new Body({name:"Neutron Star", radius:0.2, mass:10**29, position:[0,-175], velocity:[40000,0], color:"hsl(146, 10%, 44%)"});

const display = new Display();
window.addEventListener('load', function() {
    display.animate();
})