const focusMenu = document.getElementById("focusMenu");

const distanceInputScale = 10**6;
const speedInputScale = 10**3;
let massInputScale = 10**30;

class ViewControls  {

    static zoomInFactor = 1.1;
    static zoomOutFactor = 0.9;

    static maxZoom = 5000;
    static minZoom = 0.05;

    constructor(display) {
        this.display = display;

        this.zoomScale = 1;

        this.center = [this.display.canvas.width/2,this.display.canvas.height/2];
        this.mousefocus = [[this.display.canvas.width/2,this.display.canvas.height/2]];

        this.isPressed = false;
        this.xstart = 0;
        this.ystart = 0;

        this.focusbody = null;

        addEventListener("mousedown", (event) => this.pointerDown(event.clientX,event.clientY));
        addEventListener("mousemove", (event) => this.pointerMove(event.clientX,event.clientY));
        addEventListener("mouseup", (event) => this.pointerUp(event));

        // event.clientX will have value with mouseclick but no value with touchscreen
        this.display.canvas.addEventListener("touchstart", (event) => this.touchStart(event), {passive: false});
        this.display.canvas.addEventListener("touchmove", (event) => this.touchMove(event), {passive: false});
        this.display.canvas.addEventListener("touchend", (event) => this.touchEnd(event));
        this.display.canvas.addEventListener("touchcancel", (event) => this.touchEnd(event));

        // Preventing page zoom on safari
        document.addEventListener("gesturestart", (event) => event.preventDefault());
        document.addEventListener("gesturechange", (event) => event.preventDefault());
        document.addEventListener("gestureend", (event) => event.preventDefault());

        addEventListener("wheel", (event) => this.wheel(event), {passive: false});
        addEventListener("resize", (event) => this.resetViewToDefault());

        // Pinch zoom on touchscreen 
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

    pointerDown(x,y) {
        if (!event.target.closest("canvas")) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        this.xstart = x - rect.left;
        this.ystart = y - rect.top;
        this.isPressed = true;
    }

    pointerUp(event) {
        this.isPressed = false;
    }

    pointerMove(x,y) {
        if (!this.isPressed || this.adjuster.drag) {
            return;
        }

        let rect = this.display.canvas.getBoundingClientRect()
        let realx = x - rect.left;
        let realy = y - rect.top;

        let translatex = (realx-this.xstart)/this.zoomScale;
        let translatey = (realy-this.ystart)/this.zoomScale;
        this.display.ctx.translate(translatex,translatey);

        this.xstart = realx;
        this.ystart = realy;
    }

    touchStart() {
        if (event.touches.length == 1) {
            this.pointerDown(event.touches[0].clientX,event.touches[0].clientY);
        }
        else if (event.touches.length == 2) {
            if (event.touches[0].target.closest("canvas") && event.touches[1].target.closest("canvas")) {
                this.pinchDistance = this.touchesDistance(event.touches);
                
                let middle = this.touchesMiddle(event.touches);
                this.pointerDown(middle[0],middle[1]);
            }
        }
    }

    touchMove() {
        event.preventDefault();
        if (event.touches.length == 1) {
            this.pointerMove(event.touches[0].clientX,event.touches[0].clientY);
        }
        else if (event.touches.length == 2) {
            this.pinchZoom(event);
            
            let middle = this.touchesMiddle(event.touches);
            this.pointerMove(middle[0],middle[1]);
        }
    }

    touchEnd() {
        this.pointerUp(event.touches);
        if (event.touches.length == 2) {
            this.pinchDistance = null;
        }
    }

    pinchZoom(event) {
        let newDistance = this.touchesDistance(event.touches);

        if (this.pinchDistance != null) {
            if (newDistance / this.pinchDistance < 0.95 || newDistance / this.pinchDistance > 1.0526) {
                let zoomFactor = newDistance / this.pinchDistance;
                let middle = this.touchesMiddle(event.touches);

                this.zoom(middle[0],middle[1],zoomFactor < 1 ? 1 : -1);
                this.pinchDistance = newDistance;
            }
        }
    }

    touchesDistance(touches) {
        let x = touches[0].clientX - touches[1].clientX;
        let y = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(x**2 + y**2);
    }

    touchesMiddle(touches) {
        let x = (touches[0].clientX + touches[1].clientX)/2
        let y = (touches[0].clientY + touches[1].clientY)/2
        return [x,y];
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
            return;
        }

        this.zoomScale *= zoomFactor;
        this.display.bodies.forEach((body) => this.updateText(body));

        let xoffset = x-(this.display.canvas.width/2);
        let yoffset = y-(this.display.canvas.height/2);
        let c = this.getCenter();
        
        this.mousefocus = [c[0]+xoffset/this.zoomScale*zoomFactor,c[1]+yoffset/this.zoomScale*zoomFactor];

        let widthtranslation = zoomFactor > 1 ? -this.mousefocus[0] * 1/11: this.mousefocus[0] * 1/9;
        let heighttranslation = zoomFactor > 1 ? -this.mousefocus[1] * 1/11: this.mousefocus[1] * 1/9;

        this.display.ctx.scale(zoomFactor,zoomFactor);
        this.display.ctx.translate(widthtranslation,heighttranslation);
        zoomFactor = 1;
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
            Adjuster.clickDistance = 30;

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