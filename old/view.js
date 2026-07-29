class Rendering {

    static renderingArea = 8000;

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
        this.display.ctx.arc(body.position[0],body.position[1],body.radius+10/zoom,0,Math.PI*2);

        // Arrow for velocity
        let arrowEndPoint = this.viewControls.adjuster.getVelocityArrowPosition();

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
    static maxZoom = 5000000000000000000;
    static minZoom = 0.05;

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

        addEventListener("mousedown", (event) => this.pointerDown(event));
        addEventListener("mouseup", (event) => this.pointerUp(event));
        addEventListener("mousemove", (event) => this.pointerMove(event));

        // event.clientX will have value with mouseclick but no value with touchscreen
        addEventListener("touchstart", (event) => this.pointerDown(event.touches[0]));
        addEventListener("touchend", (event) => this.pointerUp(event.touches[0]));
        addEventListener("touchmove", (event) => this.pointerMove(event.touches[0]));

        addEventListener("wheel", (event) => this.wheel(event), {passive: false});
        addEventListener("resize", (event) => this.resetViewToDefault());

        // Pinch zoom on touchscreen 
        addEventListener("touchstart", (event) => this.pinchStart(event), { passive: false });
        addEventListener("touchend", (event) => this.pinchEnd(event), { passive: false });
        addEventListener("touchmove", (event) => this.pinchZoom(event), { passive: false });
        this.pinchDistance = null;

        focusMenu.addEventListener("change", () => this.changefocus());
        this.changefocus();
        this.display.updateMenus();

        this.adjuster = new Adjuster(this.display,this);

        this.resetView = document.getElementById("resetView");
        this.resetView.addEventListener("click", () => this.resetViewToDefault());

        // Make display.canvas full size and center orbits
        this.resetViewToDefault();
    }

    pointerDown(event) {
        if (!event.target.closest("canvas")) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        this.xstart = event.clientX - rect.left;
        this.ystart = event.clientY - rect.top;
        this.isPressed = true;
    }

    pointerUp(event) {
        this.isPressed = false;
    }

    pointerMove(event) {
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

    pinchStart(event) {
        if (event.touches.length == 2) {
            this.pinchDistance = this.touchesDistance(event.touches);
        }
    }

    pinchZoom(event) {
        if (event.touches.length == 2) {

            event.preventDefault();
            let newDistance = this.touchesDistance(event.touches);

            if (this.pinchDistance != null) {
                if (newDistance / this.pinchDistance < 0.9 || newDistance / this.pinchDistance > 1.11) {
                    let zoomFactor = newDistance / this.pinchDistance < 1 ? 1 : -1;
                    let x = (event.touches[0].clientX + event.touches[1].clientX)/2
                    let y = (event.touches[0].clientY + event.touches[1].clientY)/2

                    this.zoom(x,y,zoomFactor-1);
                    this.pinchDistance = newDistance;
                }
            }
        }
    }

    pinchEnd(event) {
        this.pinchDistance = null;
    }

    touchesDistance(touches) {
        let x = touches[0].clientX - touches[1].clientX;
        let y = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(x**2 + y**2);
      }

    wheel(event) {
        if (!event.target.closest("canvas")) {
            return;
        }

        event.preventDefault();
        this.zoom(event.clientX,event.clientY,event.deltaY);
    }

    zoom (x,y,dy) {
        let zoomFactor = dy < 0 ? ViewControls.zoomInFactor : ViewControls.zoomOutFactor;

        // Check if the new zoom level is within the allowed range
        if (this.zoomScale*zoomFactor >= ViewControls.maxZoom || this.zoomScale*zoomFactor <= ViewControls.minZoom) {
            this.currentZoom = 1;
            return;
        } else {
            this.currentZoom = zoomFactor;
        }

        this.zoomScale *= this.currentZoom;
        this.display.bodies.forEach((body) => this.updateText(body));

        let xoffset = x-(this.display.canvas.width/2);
        let yoffset = y-(this.display.canvas.height/2);
        let c = this.getCenter();
        
        this.mousefocus = [c[0]+xoffset/this.zoomScale*this.currentZoom,c[1]+yoffset/this.zoomScale*this.currentZoom];
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

    // If screen is smaller than 700px make the canvas full screen and use the dropdown toggles for tools
    resetViewToDefault() {
        if (window.innerWidth <= 700) {
            // Larger click zone for touchscreen
            Adjuster.clickDistance = 20;

            this.display.canvas.width = window.innerWidth;
            this.display.canvas.height = window.innerHeight;
        }
        else {
            Adjuster.clickDistance = 10;
            this.display.canvas.width = window.innerWidth*0.8;
            this.display.canvas.height = window.innerHeight;
        }


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