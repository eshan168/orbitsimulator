const distanceInputScale = 10**6;
const speedInputScale = 10**3;
let massInputScale = 10**30;

class Rendering {

    static renderingArea = 20000;

    constructor(display) {
        this.display = display
        
        this.tools = document.getElementById("tools");
        this.debug = document.getElementById("debug");
        this.nameVisibility = document.getElementById("shownames");

        this.viewControls = new ViewControls(this.display);
    }
    
    drawState() {
        // Red box around sandbox area
        // Anything outside of this box is not simulated and will be lost if the body leaves the sandbox area
        this.display.ctx.strokeStyle = "hsl(0, 100%, 18%)";
        this.display.ctx.lineWidth = 2/this.viewControls.zoomScale;
        this.display.ctx.strokeRect(-Rendering.renderingArea, -Rendering.renderingArea, 2 * Rendering.renderingArea, 2 * Rendering.renderingArea);

        for (let body of this.display.bodies) {
            // If body is beyond edge delete it 
            if (!Rendering.insideRenderingArea(body.position)) {
                this.display.bodyControls.deleteBody(body);
                this.viewControls.adjuster.changeTargetBody(null);
                continue;
            }

            this.drawtrail(body);
            this.drawBody(body)
            this.drawAdjuster();

            // So tracking a body is just translating the display.ctx by the difference of the previous position and the current position
            body.prevPostion = [...body.position];
        }
    }

    drawBody(body) {
        // Draw Body
        this.display.ctx.strokeStyle = body.color;
        this.display.ctx.beginPath();
        this.display.ctx.fillStyle = body.color;
        this.display.ctx.arc(body.position[0],body.position[1],body.radius,0,Math.PI*2);
        this.display.ctx.fill();

        // Draw the body's name a certian distance from the body and font size
        let zoom = this.viewControls.zoomScale;
        if (this.nameVisibility.checked) {
            this.display.ctx.fillStyle = "white";
            this.display.ctx.font = body.font;
            if (body.radius > 50/zoom) {
                let lighting = Number(body.color.substring(body.color.length-4,body.color.length-2));
                if (lighting > 50) {
                    this.display.ctx.fillStyle = "hsl(0, 0%, 14%)";
                }

                let textMetrics = this.display.ctx.measureText(body.name)
                let width = textMetrics.width;
                let height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                this.display.ctx.fillText(body.name,body.position[0]-width/2,body.position[1] + 0.1*(body.radius/0.696));
            }
            else {
                this.display.ctx.fillText(body.name,body.position[0]+body.textoffset,body.position[1]-body.textoffset);   
            }
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

    drawAdjuster() {
        if (!this.viewControls.adjuster.targetBody) {
            return;
        }

        let body = this.viewControls.adjuster.targetBody;
        let zoom = this.viewControls.zoomScale;

        // Circle around body
        this.display.ctx.strokeStyle = "white";
        this.display.ctx.lineWidth = 2/zoom;
        this.display.ctx.beginPath();
        this.display.ctx.arc(body.position[0],body.position[1],body.radius+Adjuster.clickDistance/zoom,0,Math.PI*2);

        // Arrow for velocity
        let arrowEndPoint = this.viewControls.adjuster.getVelocityArrowPosition();
        // let difference = [arrowEndPoint[0]-body.position[0],arrowEndPoint[1]-body.position[1]];
        // let angle = Math.atan(difference[1]/difference[0]);

        this.display.ctx.fillStyle = "white";
        this.display.ctx.moveTo(body.position[0],body.position[1]);
        this.display.ctx.lineTo(arrowEndPoint[0],arrowEndPoint[1]);
        this.display.ctx.arc(arrowEndPoint[0],arrowEndPoint[1],2/zoom,0,Math.PI*2);

        this.display.ctx.stroke();

    }

    clearCanvas() {
        let clearArea = Rendering.renderingArea + 100000;
        this.display.ctx.clearRect(-clearArea, -clearArea, 2 * clearArea, 2 * clearArea);
    }

    static insideRenderingArea(position) {
        return (Math.abs(position[0]) < Rendering.renderingArea && Math.abs(position[1]) < Rendering.renderingArea)
    }
}

const focusMenu = document.getElementById("focusMenu");

class ViewControls  {

    static zoomInFactor = 1.1;
    static zoomOutFactor = 0.9;

    static maxZoom = 5000;
    static minZoom = 0.02;

    constructor(display) {
        this.display = display;

        this.currentZoom = 1;
        this.zoomScale = 1;

        this.center = [this.display.canvas.width/2,this.display.canvas.height/2];
        this.mousefocus = [[this.display.canvas.width/2,this.display.canvas.height/2]];

        this.isPressed = false;
        this.xstart = 0;
        this.ystart = 0;

        this.focusbody = null;

        addEventListener("mousedown", (event) => this.mouseDown(event));
        addEventListener("mouseup", (event) => this.mouseUp(event));
        addEventListener("mousemove", (event) => this.mouseMove(event));
        addEventListener("wheel", (event) => this.wheel(event), {passive: false});
        addEventListener("resize", (event) => this.resize(event));

        focusMenu.addEventListener("change", () => this.changefocus());
        this.changefocus();
        this.display.updateMenus();

        this.adjuster = new Adjuster(this.display,this);

        this.resetView = document.getElementById("resetView");
        this.resetView.addEventListener("click", () => this.resetViewToDefault());

        // Make display.canvas full size and center orbits
        this.display.canvas.width = window.innerWidth*0.8;
        this.display.canvas.height = window.innerHeight;
        this.resetViewToDefault();
    }

    mouseDown(event) {
        if (!event.target.closest("canvas")) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        this.xstart = event.clientX - rect.left;
        this.ystart = event.clientY - rect.top;
        this.isPressed = true;
    }

    mouseUp(event) {
        this.isPressed = false;
    }

    mouseMove(event) {
        if (!this.isPressed || this.adjuster.drag) {
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
        this.display.bodies.forEach((body) => this.updateText(body));

        let xoffset = event.clientX-(this.display.canvas.width/2);
        let yoffset = event.clientY-(this.display.canvas.height/2);
        let c = this.getCenter();
        
        this.mousefocus = [c[0]+xoffset/this.zoomScale*this.currentZoom,c[1]+yoffset/this.zoomScale*this.currentZoom];
    }

    resize(event) {
        this.display.canvas.width = window.innerWidth*0.8;
        this.display.canvas.height = window.innerHeight;

        this.resetViewToDefault();
    }

    updatezoom() {
        if (this.currentZoom != 1){
            let widthtranslation = this.currentZoom > 1 ? -this.mousefocus[0] * 1/11: this.mousefocus[0] * 1/9;
            let heighttranslation = this.currentZoom > 1 ? -this.mousefocus[1] * 1/11: this.mousefocus[1] * 1/9;

            this.display.ctx.scale(this.currentZoom,this.currentZoom);
            this.display.ctx.translate(widthtranslation,heighttranslation);
            this.currentZoom = 1;
        }
        // log(this.zoomScale);
    }

    updateText(body) {
        body.textoffset = (body.radius+5/this.zoomScale)
        body.font = `${Math.max(Math.max(10/this.zoomScale,body.radius/2), minfont)}px Arial`;
    }

    changefocus() {
        this.focusbody = this.display.keysToBodies[focusMenu.value];
        if (!this.focusbody) {
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
        this.display.ctx.translate(this.display.canvas.width*0.5,this.display.canvas.height*0.5);
    
        this.display.bodies.forEach((body) => this.updateText(body));
    }

    getCenter() {
        let transform = this.display.ctx.getTransform();
        return [-(transform.e-this.display.canvas.width/2)/transform.a, 
                -(transform.f-this.display.canvas.height/2)/transform.d];
    }
}

const adjustMenu = document.getElementById("adjustMenu");

const xpInput = document.getElementById("xpos");
const ypInput = document.getElementById("ypos");
const xvInput = document.getElementById("xvel");
const yvInput = document.getElementById("yvel");

const deleteBody = document.getElementById("deleteBody");
const deleteTrail = document.getElementById("deleteTrail");

class Adjuster {

    static clickDistance = 10;

    constructor(display,viewControls) {
        this.display = display;
        this.viewControls = viewControls;
        this.targetBody = null;

        this.drag = false;
        this.dragType = "pos";
        this.mouseDownCoords = [0,0];
        this.xstart = 0;
        this.ystart = 0;

        this.velocityArrowScale = 1000000;
        addEventListener("mouseup", (event) => this.mouseUp(event));
        addEventListener("mousedown", (event) => this.mouseDown(event));
        addEventListener("mousemove", (event) => this.mouseMove(event));
        addEventListener("wheel", (event) => this.wheel(event));

        addEventListener("keydown", () => this.changeTargetBodyStat(event));
        adjustMenu.addEventListener("change", () => this.changeTargetBody(this.display.keysToBodies[adjustMenu.value]));

        deleteBody.addEventListener("click", () => { if (this.targetBody) this.display.bodyControls.deleteBody(this.targetBody)});
        deleteTrail.addEventListener("click", () => { if (this.targetBody) this.targetBody.trail.clearTrail()});
    }

    mouseDown(event) {
        let rect = this.display.canvas.getBoundingClientRect()
        this.mouseDownCoords = [event.clientX-rect.left,event.clientY-rect.top];

        if (!this.targetBody) {
            return;
        }

        this.xstart = event.clientX - rect.left;
        this.ystart = event.clientY - rect.top;

        // check if the click is in the velocity or body interaction zone
        let vel = this.getVelocityArrowPosition();;
        let pos = this.targetBody.position;
        let velDistance = this.clickDistance(event,vel);
        let posDistance = this.clickDistance(event,pos);
        let minDistance = Adjuster.clickDistance/this.viewControls.zoomScale;
        
        // Pick Whichever distance is closest to their interaction zones, if neither is use the body radius or if not that then drag = false
        if (posDistance < this.targetBody.radius && posDistance > minDistance && velDistance > minDistance) {
            this.drag = true;
            this.dragType = "pos";
        }
        else if (posDistance < velDistance) {
            if (posDistance < minDistance) {
                this.drag = true;
                this.dragType = "pos";
            }
        }
        else if (velDistance < posDistance) {
            if (velDistance < minDistance) {
                this.drag = true;
                this.dragType = "vel";
            }
        }
        else {
            this.drag = false;
        }
    }

    mouseUp(event) {
        this.drag = false;

        let rect = this.display.canvas.getBoundingClientRect()
        let mouseUpCoords = [event.clientX-rect.left,event.clientY-rect.top];

        // if the click was a button or other object other than the canvas or the click was to translate, don't change the targetBody
        let clickedCanvas = (event.target.closest("canvas"));
        let didNotTranslate =  (this.mouseDownCoords[0] == mouseUpCoords[0] && this.mouseDownCoords[1] == mouseUpCoords[1]);
        if (clickedCanvas && didNotTranslate) {
            this.changeTargetBody(this.checkForBody(event));
        }
    }

    mouseMove(event) {
        if (!this.drag || !this.targetBody) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        if (this.dragType == "pos") {
            let translatex = (x-this.xstart)/this.viewControls.zoomScale;
            let translatey = (y-this.ystart)/this.viewControls.zoomScale;

            this.targetBody.position[0] += translatex;
            this.targetBody.position[1] += translatey;
            this.targetBody.trail.clearTrail();
        }
        if (this.dragType == "vel") {
            let relativePos = this.clickCoords(event);
            let bodyPos = this.targetBody.position;

            this.targetBody.velocity[0] = (relativePos[0]-bodyPos[0])/this.velocityArrowScale*this.viewControls.zoomScale;
            this.targetBody.velocity[1] = (relativePos[1]-bodyPos[1])/this.velocityArrowScale*this.viewControls.zoomScale;
        }

        this.xstart = x;
        this.ystart = y;
    }

    wheel(event) {
        this.velocityArrowScale = Math.max(500000, Math.min(5000000, 1000000*Math.sqrt(this.viewControls.zoomScale)));
    }

    changeTargetBody(body) {
        this.targetBody = body;
        if (body){
            adjustMenu.value = body.name;
        }
        else {
            xpInput.value = "";
            ypInput.value = "";
            xvInput.value = "";
            yvInput.value = "";
            adjustMenu.value = "None";
        }
    }

    updateAdjusterText() {
        if (!this.targetBody) {
            return;
        }

        // console.log(this.targetBody.position+" "+this.targetBody.velocity);
        if (document.activeElement != xpInput) xpInput.value = round(this.targetBody.position[0], 4);
        if (document.activeElement != ypInput) ypInput.value = round(this.targetBody.position[1], 4);
        if (document.activeElement != xvInput) xvInput.value = round(this.targetBody.velocity[0]*scale / speedInputScale, 4);
        if (document.activeElement != yvInput) yvInput.value = round(this.targetBody.velocity[1]*scale / speedInputScale, 4);
    }

    changeTargetBodyStat(event) {
        let active = document.activeElement;
        if (event.key != "Enter" || !this.targetBody) {
            return;
        }

        if (active == xpInput) {
            this.targetBody.position[0] = Number(xpInput.value);
            this.targetBody.trail.clearTrail();
        }
        else if (active == ypInput) {
            this.targetBody.position[1] = Number(ypInput.value);
            this.targetBody.trail.clearTrail();
        } 
        else if (active == xvInput) {
            this.targetBody.velocity[0] = Number(xvInput.value/scale * speedInputScale);
        }  
        else if (active == yvInput) {
            this.targetBody.velocity[1] = Number(yvInput.value/scale * speedInputScale);
        }

        document.activeElement.disabled = true;
        xpInput.disabled = false;
        ypInput.disabled = false;
        xvInput.disabled = false;
        yvInput.disabled = false;
    }  

    // Get the click position using ctx transformation and return distance
    clickDistance(event,coords) {
        let rect = this.display.canvas.getBoundingClientRect()
        let transform = this.display.ctx.getTransform();
        let x = (event.clientX - rect.left - transform.e)/transform.a;
        let y = (event.clientY - rect.top - transform.f)/transform.d;
        return Math.sqrt((coords[0]-x)**2 + (coords[1]-y)**2);
    }

    // Get the click coordinates using ctx transformation and return distance
    clickCoords(event) {
        let rect = this.display.canvas.getBoundingClientRect()
        let transform = this.display.ctx.getTransform();
        let x = (event.clientX - rect.left - transform.e)/transform.a;
        let y = (event.clientY - rect.top - transform.f)/transform.d;
        return [x,y];
    }

    checkForBody(event) {
        // check if the click is in the velocity or body interaction zone
        if (this.targetBody) {
            let vel = this.getVelocityArrowPosition();;
            let pos = this.targetBody.position;
            let velDistance = this.clickDistance(event,vel);
            let posDistance = this.clickDistance(event,pos);

            if (velDistance < Adjuster.clickDistance/this.viewControls.zoomScale && velDistance < posDistance) {
                return this.targetBody;
            }
            else if (posDistance < Adjuster.clickDistance/this.viewControls.zoomScale && posDistance < velDistance) {
                return this.targetBody;
            }
        }

        let minDistance = 1e99;
        let minBody = null;

        for (let body of this.display.bodies) {
            let distance = this.clickDistance(event,body.position);
            if (distance < body.radius) {
                minBody = body;
                break;
            }
            if (distance < Adjuster.clickDistance/this.viewControls.zoomScale) {
                if (distance < minDistance) {
                    minDistance = distance;
                    minBody = body;
                }
            }
        }

        if (minBody) {
            return minBody
        }

        return null;
    }

    getVelocityArrowPosition() {
        if (!this.targetBody) {
            return;
        }

        let pos = this.targetBody.position;
        let x = this.targetBody.velocity[0]*this.velocityArrowScale/this.viewControls.zoomScale;
        let y = this.targetBody.velocity[1]*this.velocityArrowScale/this.viewControls.zoomScale;

        return [pos[0]+x,pos[1]+y];
    }
}

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

        this.paused = false;
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
}

function log(text) {
    debug.innerText = text;
}

function round(num,precision) {
    return Math.round(num*10**precision)/10**precision;
}