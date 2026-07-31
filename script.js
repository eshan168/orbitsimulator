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

window.addEventListener('load', function() {
    const display = new Display();
    display.animate();
})