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
        addEventListener("mousedown", (event) => this.pointerDown(event));
        addEventListener("mouseup", (event) => this.pointerUp(event));
        addEventListener("mousemove", (event) => this.pointerMove(event));

        addEventListener("wheel", (event) => this.wheel(event));
        addEventListener("touchstart", (event) => this.pointerDown(event.touches[0]));
        addEventListener("touchend", (event) => this.pointerUp(event.changedTouches[0]));
        addEventListener("touchmove", (event) => this.pointerMove(event.touches[0]));

        addEventListener("keydown", () => this.changeTargetBodyStat(event));
        adjustMenu.addEventListener("change", () => this.changeTargetBody(this.display.keysToBodies[adjustMenu.value]));

        deleteBody.addEventListener("click", () => { if (this.targetBody) this.display.bodyControls.deleteBody(this.targetBody)});
        deleteTrail.addEventListener("click", () => { if (this.targetBody) this.targetBody.trail.clearTrail()});
    }

    pointerDown(event) {
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

    pointerUp(event) {
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

    pointerMove(event) {
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