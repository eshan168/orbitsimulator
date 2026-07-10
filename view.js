class Rendering {

    static renderingArea = 20000;

    constructor(display,bodies,keys,keysToBodies) {
        this.bodies = bodies;
        this.keys = keys;
        this.keysToBodies = keysToBodies;

        this.display = display
        this.tools = document.getElementById("tools");
        this.debug = document.getElementById("debug");
        this.nameVisibility = document.getElementById("shownames");

        this.viewControls = new ViewControls(this.display,this.bodies,this.keys,this.keysToBodies);
    }
    
    drawState() {
        // Red box around sandbox area
        // Anything outside of this box is not simulated and will be lost if the body leaves the sandbox area
        this.display.ctx.strokeStyle = "hsl(0, 100%, 18%)";
        this.display.ctx.lineWidth = 2/this.viewControls.zoomScale;
        this.display.ctx.strokeRect(-Rendering.renderingArea, -Rendering.renderingArea, 2 * Rendering.renderingArea, 2 * Rendering.renderingArea);

        for (let body of this.bodies) {
            if (Math.abs(body.position[0]) > Rendering.renderingArea || Math.abs(body.position[1]) > Rendering.renderingArea) {
                this.display.deleteBody(body);
                continue;
            }

            this.drawtrail(body);

            // Draw Body
            this.display.ctx.strokeStyle = body.color;
            this.display.ctx.beginPath();
            this.display.ctx.fillStyle = body.color;
            this.display.ctx.arc(body.position[0],body.position[1],body.radius,0,Math.PI*2);
            this.display.ctx.fill();

            // Draw the body's name a certian distance from the body and font size
            if (this.nameVisibility.checked) {
                this.display.ctx.fillStyle = "white";
                this.display.ctx.font = body.font;
                this.display.ctx.fillText(body.name,body.position[0]+body.textoffset,body.position[1]-body.textoffset);
            }

            // So tracking a body is just translating the display.ctx by the difference of the previous position and the current position
            body.prevPostion = [...body.position];
        }
    }

    // Draw compressedTrail and then tempTrial using quadriatic curves where the midpoints are the points and the actual points are the control points
    drawtrail(body) {
        let comp = body.trail.compressedTrail;
        let temp = body.trail.tempTrail;

        if (comp.length > 1) {
            this.display.ctx.beginPath();
            this.display.ctx.moveTo((comp[0][0]+comp[1][0])/2, (comp[0][1]+comp[1][1])/2);

            for (let i=1; i<comp.length-1; i++) {
                let xp = (comp[i][0] + comp[i+1][0])/2;
                let yp = (comp[i][1] + comp[i+1][1])/2;
                this.display.ctx.quadraticCurveTo(comp[i][0],comp[i][1],xp,yp);
            }
            let xp = (comp[comp.length-1][0] + temp[0][0])/2;
            let yp = (comp[comp.length-1][1] + temp[0][1])/2;
            this.display.ctx.quadraticCurveTo(comp[comp.length-1][0],comp[comp.length-1][1],xp,yp);

            if (temp.length >= 2) {
                for (let i=1; i<temp.length-1; i++) {
                    let xp = (temp[i][0] + temp[i+1][0])/2;
                    let yp = (temp[i][1] + temp[i+1][1])/2;
                    this.display.ctx.quadraticCurveTo(temp[i][0],temp[i][1],xp,yp);
                }
                this.display.ctx.quadraticCurveTo(temp[temp.length-2][0],temp[temp.length-2][1],temp[temp.length-1][0],temp[temp.length-1][1]);
            }
            else {
                this.display.ctx.lineTo(body.position[0],body.position[1]);
            }

            this.display.ctx.strokeStyle = body.trail.color;
            this.display.ctx.lineWidth = linewidth/this.viewControls.zoomScale;
            this.display.ctx.stroke();
        }
    }

    clearCanvas() {
        let clearArea = Rendering.renderingArea + 100000;
        this.display.ctx.clearRect(-clearArea, -clearArea, 2 * clearArea, 2 * clearArea);
    }
}

const focusMenu = document.getElementById("focus");

class ViewControls  {

    static zoomInFactor = 1.1;
    static zoomOutFactor = 0.9;

    static maxZoom = 5000;
    static minZoom = 0.02;

    constructor(display,bodies,keys,keysToBodies) {
        this.display = display;
        this.bodies = bodies;
        this.keys = keys;
        this.keysToBodies = keysToBodies;

        this.currentZoom = 1;
        this.zoomScale = 1;

        this.center = [this.display.canvas.width/2,this.display.canvas.height/2];
        this.mousefocus = [[this.display.canvas.width/2,this.display.canvas.height/2]];

        this.isPressed = false;
        this.xstart = 0;
        this.ystart = 0;
        // this.totalTranslation = [0,0];

        this.focusbody = null;

        addEventListener("mousedown", (event) => this.mouseDown(event));
        addEventListener("mouseup", (event) => this.mouseUp(event));
        addEventListener("mousemove", (event) => this.mouseMove(event));
        addEventListener("wheel", (event) => this.wheel(event), {passive: false});
        addEventListener("resize", (event) => this.resize(event));

        focusMenu.addEventListener("change", () => this.changefocus());
        this.changefocus();
        this.updateMenus();

        this.resetView = document.getElementById("resetView");
        this.resetView.addEventListener("click", () => this.resetViewToDefault());

        // Make display.canvas full size and center orbits
        this.display.canvas.width = window.innerWidth*0.8;
        this.display.canvas.height = window.innerHeight;

        // this.display.ctx.setTransform(1,0,0,1,0,0);
        // this.display.ctx.translate(window.innerWidth*0.4-this.center[0],window.innerHeight*0.5-this.center[1]);
        this.resetViewToDefault();
    }

    mouseDown(event) {
        let rect = this.display.canvas.getBoundingClientRect()
        this.xstart = event.clientX - rect.left;
        this.ystart = event.clientY - rect.top;
        this.isPressed = true;
    }

    mouseUp(event) {
        this.isPressed = false;
    }

    mouseMove(event) {
        if (!this.isPressed) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        let translatex = (x-this.xstart)/this.zoomScale;
        let translatey = (y-this.ystart)/this.zoomScale;
        this.display.ctx.translate(translatex,translatey);

        this.xstart = x;
        this.ystart = y;
    }

    wheel(event) {
        event.preventDefault();
        let zoomFactor = event.deltaY < 0 ? ViewControls.zoomInFactor : ViewControls.zoomOutFactor;

        // Check if the new zoom level is within the allowed range
        if (this.zoomScale*zoomFactor >= ViewControls.maxZoom || this.zoomScale*zoomFactor <= ViewControls.minZoom) {
            this.currentZoom = 1;
            return;
        } else {
            this.currentZoom = zoomFactor;
        }

        this.zoomScale *= this.currentZoom;
        this.bodies.forEach((body) => this.updateText(body));

        let xevent = event.clientX;
        let yevent = event.clientY;
        let xoffset = xevent-(this.display.canvas.width/2);
        let yoffset = yevent-(this.display.canvas.height/2);
        let c = this.getCenter();
        
        this.mousefocus = [c[0]+xoffset/this.zoomScale*this.currentZoom,c[1]+yoffset/this.zoomScale*this.currentZoom];
    }

    resize(event) {
        this.display.canvas.width = window.innerWidth*0.8;
        this.display.canvas.height = window.innerHeight;
        this.zoomScale = 1;

        this.display.ctx.translate(window.innerWidth/2-this.center[0],window.innerHeight/2-this.center[1]);
        this.bodies.forEach((body) => this.updateText(body));
    }

    // translate(x,y) {
    //     if (Math.abs(this.totalTranslation[0]+x)+400/this.zoomScale > Rendering.renderingArea || Math.abs(this.totalTranslation[1]+y)+300/this.zoomScale > Rendering.renderingArea) {
    //         return;
    //     }
    //     this.totalTranslation[0] += x;
    //     this.totalTranslation[1] += y;
    //     this.display.ctx.translate(x,y);
    // }

    updatezoom() {
        if (this.currentZoom != 1){
            let widthtranslation = this.currentZoom > 1 ? -this.mousefocus[0] * 1/11: this.mousefocus[0] * 1/9;
            let heighttranslation = this.currentZoom > 1 ? -this.mousefocus[1] * 1/11: this.mousefocus[1] * 1/9;

            this.display.ctx.scale(this.currentZoom,this.currentZoom);
            this.display.ctx.translate(widthtranslation,heighttranslation);
            this.currentZoom = 1;
        }
    }

    updateText(body) {
        body.textoffset = (body.radius+5/this.zoomScale)
        body.font = `${Math.max(Math.max(10/this.zoomScale,body.radius), minfont)}px Arial`;
    }

    changefocus() {
        this.focusbody = this.keysToBodies[focusMenu.value];
        if (this.focusbody == null) {
            return;
        }
        this.center = this.getCenter();
        let position = this.focusbody.position;
        
        this.display.ctx.translate(this.center[0]-position[0],this.center[1]-position[1]);
    }

    followFocus() {
        if (this.focusbody == null) {
            return;
        }

        this.display.ctx.translate(this.focusbody.prevPostion[0]-this.focusbody.position[0], this.focusbody.prevPostion[1]-this.focusbody.position[1]);
    }

    resetViewToDefault() {
        focusMenu.value = "None";
        this.focusbody = null;

        this.zoomScale = 1;
        this.display.ctx.setTransform(1,0,0,1,0,0);
        this.display.ctx.translate(window.innerWidth*0.125,window.innerHeight*0.15);
    
        this.bodies.forEach((body) => this.updateText(body));
    }

    updateMenus() {
        focusMenu.innerHTML = "";
        focusMenu.add(new Option("None"));
        for (let key of this.keys) {
            focusMenu.add(new Option(key));
        }
    }

    getCenter() {
        const m = this.display.ctx.getTransform();
        const centerX = this.display.canvas.width / 2;
        const centerY = this.display.canvas.height / 2;

        // Use DOMMatrix inverse:
        const inv = m.inverse();

        // Apply inverse transform to screen point
        const realCenter = [
            (inv.a * centerX + inv.c * centerY + inv.e),
            inv.b * centerX + inv.d * centerY + inv.f
        ];

        return realCenter;
    }
}

class TimeControls {

    constructor(bodies) {
        this.bodies = bodies;

        this.backward = document.getElementById("backward");
        this.forward = document.getElementById("forward");
        this.reverse = document.getElementById("reverse");
        this.pauseButton = document.getElementById("pause");

        this.backward.addEventListener("click", () => this.skipbackward());
        this.forward.addEventListener("click", () => this.skipforward());
        this.reverse.addEventListener("click", () => this.reverseTime());
        this.pauseButton.addEventListener("click", () => this.pause());

        this.paused = false;
    }

    reverseTime() {
        VelocityVerletSim.currentTimestep *= -1;
        if (this.reverse.innerText == "Reverse") {
            this.reverse.innerText = "Forward";
        } else {
            this.reverse.innerText = "Reverse";
        }

        for (let body of this.bodies) {
            body.trail.clearTrail();
        }
    }

    skipbackward() {
        if (VelocityVerletSim.currentTimestep*0.5 > minspeed) {
            VelocityVerletSim.currentTimestep *= 0.5;
            VelocityVerletSim.extrasteps = Math.max(VelocityVerletSim.extraSteps-1, VelocityVerletSim.minSteps);
            Trail.adjustTrailsToTime(false,this.bodies);
        }
    }

    skipforward() {
        if (VelocityVerletSim.currentTimestep*2 < maxspeed) {
            VelocityVerletSim.currentTimestep *= 2;
            VelocityVerletSim.extrasteps = Math.min(VelocityVerletSim.extraSteps+1, VelocityVerletSim.maxSteps);
            Trail.adjustTrailsToTime(true,this.bodies);
        }
    }

    pause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseButton.innerText = "▶︎";
        }
        else {
            this.pauseButton.innerText = "⏸︎";
        }
    }
}

function log(text) {
    debug.innerText = text;
}

function round(num) {
    return Math.round(num*1000)/1000;
}