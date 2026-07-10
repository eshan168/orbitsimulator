
class Display {

    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext("2d");

        let sun = new Body({name:"Sun", radius:1.392/2, mass:1.989 * 10**30, position:[400,300], vector:[0,0], color:"hsl(51, 98%, 52%)"});
        let mercury = new Body({name:"Mercury", radius:0.004881/2, mass:3.3010 * 10**23, position:[354,300], vector:[0,58980], color:"hsl(0, 9%, 63%)"});
        let venus = new Body({name:"Venus", radius:0.0121036/2, mass:4.8673 * 10**24, position:[292.52,300], vector:[0,35260], color:"hsl(40, 100%, 70%)"});
        let earth = new Body({name:"Earth", radius:0.0121036/2, mass:5.972 * 10**24, position:[247.9,300], vector:[0,29290], color:"hsl(202, 100%, 41%)"});
        let moon = new Body({name:"Moon", radius:0.003475/2, mass:7.35 * 10**22, position:[247.495,300], vector:[0,30313.1], color:"hsl(0, 0%, 55%)"});
        let mars = new Body({name:"Mars", radius:0.0067924/2, mass:6.4169 * 10**23, position:[193.35,300], vector:[0,26500], color:"hsl(27, 100%, 46%)"});
        let jupiter = new Body({name:"Jupiter",radius:0.142984/2,mass:1.89813 * 10**27,position:[-340.595,300], vector:[0,13720], color:"hsl(33, 100%, 26%)"});
        let ganymede = new Body({name:"Ganymede", radius:0.0052682/2, mass:1.4819 * 10**23, position:[-341.6642,300], vector:[0,24600], color:"hsl(189, 3%, 57%)"});
        let europa = new Body({name:"Europa", radius:0.0031216/2, mass:4.79984 * 10**22, position:[-341.259862,300], vector:[0,27464], color:"hsl(187, 17%, 59%)"});
        let saturn = new Body({name:"Saturn", radius:0.120536/2, mass:5.6851 * 10**26, position:[-957.554,300], vector:[0,10140], color:"hsl(51, 100%, 82%)"});
        let uranus = new Body({name:"Uranus", radius:0.051118/2, mass:8.6849 * 10**25, position:[-2332.696,300], vector:[0,7300], color:"hsl(174, 100%, 83%)"});
        let neptune = new Body({name:"Neptune", radius:0.049528/2, mass:1.0244 * 10**26, position:[-4071.05,300], vector:[0,5470], color:"hsl(246, 68%, 44%)"});
        let triton = new Body({name:"Triton", radius:0.0027068/2, mass:2.1389 * 10**22, position:[-4071.404759,300], vector:[0,9860], color:"hsl(117, 8%, 52%)"});

        let red_dwarf = new Body({name:"Red Dwarf", radius:0.5, mass:10**29, position:[400,130], vector:[-10000,0], color:"hsl(9, 84%, 60%)"});
        let neutron = new Body({name:"Neutron Star", radius:0.1, mass:10**29, position:[400,125], vector:[40000,0], color:"hsl(146, 10%, 44%)"});

        // let bodies = [sun,mercury];
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

const display = new Display();
window.addEventListener('load', function() {
    display.animate();
})