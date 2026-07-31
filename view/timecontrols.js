const maxspeed = 600000;
const minspeed = 10;

class TimeControls {

    constructor(display) {
        this.display = display;
        
        this.backward = document.getElementById("backward");
        this.forward = document.getElementById("forward");
        this.reverse = document.getElementById("reverse");
        this.pauseButton = document.getElementById("pause");

        this.backward.addEventListener("click", () => this.skipbackward());
        this.forward.addEventListener("click", () => this.skipforward());
        this.reverse.addEventListener("click", () => this.reverseTime());
        this.pauseButton.addEventListener("click", () => this.togglePause());

        this.paused = true;
    }

    reverseTime() {
        VelocityVerletSim.currentTimestep *= -1;
        if (this.reverse.innerText == "Reverse") {
            this.reverse.innerText = "Forward";
        } else {
            this.reverse.innerText = "Reverse";
        }

        for (let body of this.display.bodies) {
            body.trail.clearTrail();
        }
    }

    skipbackward() {
        if (Math.abs(VelocityVerletSim.currentTimestep)*0.5 > minspeed && !this.paused) {
            VelocityVerletSim.currentTimestep *= 0.5;
            VelocityVerletSim.extrasteps = Math.max(VelocityVerletSim.extraSteps-1, VelocityVerletSim.minSteps);
            Trail.adjustTrailsToTime(false,this.display.bodies);
        }
    }

    skipforward() {
        if (Math.abs(VelocityVerletSim.currentTimestep)*2 < maxspeed && !this.paused) {
            VelocityVerletSim.currentTimestep *= 2;
            VelocityVerletSim.extrasteps = Math.min(VelocityVerletSim.extraSteps+1, VelocityVerletSim.maxSteps);
            Trail.adjustTrailsToTime(true,this.display.bodies);
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseButton.innerText = "▶︎";
        }
        else {
            this.pauseButton.innerText = "⏸︎";
        }
    }

    pause() {
        this.paused = true;
        this.pauseButton.innerText = "▶︎";
    }

    unPause() {
        this.paused = false;
        this.pauseButton.innerText = "⏸︎";
    }
}