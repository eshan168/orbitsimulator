class Display {

    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        let defaultSystem = new Solar_System();

        // this.bodies = [sun,mercury];
        this.bodies = defaultSystem.bodies;
        this.keys = defaultSystem.keys;
        this.keysToBodies = defaultSystem.keysToBodies;

        this.simulator = new VelocityVerletSim(this);
        this.rendering = new Rendering(this);
        this.timeControls = new TimeControls(this);
        this.bodyControls = new BodyControls(this);
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
        
        this.rendering.viewControls.adjuster.updateAdjusterText();
        this.rendering.viewControls.followFocus();
        this.rendering.drawState();

        requestAnimationFrame(() => this.animate());
    }

    updateMenus() {
        focusMenu.innerHTML = "";
        focusMenu.add(new Option("None"));
        for (let key of this.keys) {
            focusMenu.add(new Option(key));
        }

        adjustMenu.innerHTML = "";
        adjustMenu.add(new Option("None"));
        for (let key of this.keys) {
            adjustMenu.add(new Option(key));
        }
    }
}

const bodyType = document.getElementById("bodyTypeMenu");
const massInput = document.getElementById("massInput");
const nameInput = document.getElementById("nameInput");
const createButton = document.getElementById("createBody");

class BodyControls {
    constructor(display) {
        this.display = display;

        this.clearAll = document.getElementById("clearAll");
        this.clearAll.addEventListener("click", () => this.clearAllBodies());

        createButton.addEventListener("click", () => this.createBody());
        bodyType.addEventListener("change", () => this.changeMassPlaceholder());
    }

    createBody() {
        if (massInput.value == 0 || nameInput.value == "") {
            return;
        }

        this.display.timeControls.pause();
        let center = this.display.rendering.viewControls.getCenter();
        let mass = massInput.value * massInputScale;

        let newBody = new Body({
            name: nameInput.value,
            radius: this.massToRadius(mass),
            mass: mass,
            position: [center[0],center[1]],
            velocity: [0,10000],
            color: this.bodyToColor()
        });

        this.display.keys.push(newBody.name);
        this.display.bodies.push(newBody);
        this.display.keysToBodies[newBody.name] = newBody;
        this.display.updateMenus();

        this.display.rendering.viewControls.adjuster.changeTargetBody(newBody);
        this.display.rendering.viewControls.updateText(newBody);
    }

    deleteBody(body) {
        if (!body) {
            return;
        }

        let index = this.display.bodies.indexOf(body);
        if (index > -1) {
            this.display.bodies.splice(index, 1);
            this.display.keys.splice(index, 1);
            this.display.keysToBodies = Object.fromEntries(this.display.bodies.map(body => [body.name, body]));
        }

        this.display.updateMenus();
        this.display.rendering.viewControls.adjuster.changeTargetBody(null);
    }

    clearAllBodies() {
        while (this.display.bodies.length > 0) {
            this.deleteBody(this.display.bodies[0]);
        }
    }

    // Return the estimated radius in scaled units given the mass in kgs
    massToRadius(mass) {
        if (bodyType.value == "star") {
            return 6.957*10**-1 * (mass/(1.989*10**30))**(4/5);
        }
        else if (bodyType.value == "gas") {
            return 6.9911*10**-2 * (mass/(1.898*10**27))**(1/8);
        }
        else if (bodyType.value == "solid") {
            return 6.371*10**-3 * (mass/(5.972*10**24))**(1/3);
        }
    }

    bodyToColor() {
        if (bodyType.value == "star") {
            let type = Math.floor(Math.random()*5);
            if (type == 0) return `hsl(${Math.random() * 10}, ${Math.random() * 30 + 70}%, ${Math.random() * 20 + 40}%)`; // Red
            if (type == 1) return `hsl(${Math.random() * 15 + 10}, ${Math.random() * 40 + 60}%, ${Math.random() * 20 + 50}%)`; // Orange
            if (type == 2) return `hsl(${Math.random() * 15 + 25}, ${Math.random() * 40 + 60}%, ${Math.random() * 20 + 60}%)`; // Yellow
            if (type == 4) return `hsl(${Math.random() * 40 + 200}, ${Math.random() * 40 + 60}%, ${Math.random() * 20 + 70}%)`; // Blue
        }
        else if (bodyType.value == "gas") {
            let type = Math.floor(Math.random()*3);
            if (type == 0) return `hsl(${Math.random() * 40 + 20}, ${Math.random() * 50 + 40}%, ${Math.random() * 40 + 40}%)`; // Brown
            if (type == 1) return `hsl(${Math.random() * 30 + 40}, ${Math.random() * 40 + 20}%, ${Math.random() * 30 + 70}%)`; // Yellow
            if (type == 2) return `hsl(${Math.random() * 40 + 180}, ${Math.random() * 50 + 40}%, ${Math.random() * 30 + 50}%)`; // Blue/Lightblue
        }
        else if (bodyType.value == "solid") {
            let type = Math.floor(Math.random()*3);
            if (type == 0) return `hsl(${Math.random() * 30 + 20}, ${Math.random() * 40 + 30}%, ${Math.random() * 30 + 20}%)`; // Brown
            if (type == 1) return `hsl(${Math.random() * 40 + 180}, ${Math.random() * 40 + 40}%, ${Math.random() * 30 + 70}%)`; // Icy
            if (type == 2) return `hsl(${0}, ${Math.random() * 10}%, ${Math.random() * 50 + 30}%)`; // Gray
        }
    }

    changeMassPlaceholder() {
        log(bodyType.value)
        if (bodyType.value == "star") {
            massInput.placeholder = "10^30 kg (0.5 suns)";
            massInputScale = 10**30;
        }
        else if (bodyType.value == "gas") {
            massInput.placeholder = "10^25 kg (0.1 neptunes)";
            massInputScale = 10**25;
        }
        else if (bodyType.value == "solid") {
            massInput.placeholder = "10^22 kg (0.15 moons)";
            massInputScale = 10**22;
        }
    }
}

window.addEventListener('load', function() {
    const display = new Display();
    display.animate();
})