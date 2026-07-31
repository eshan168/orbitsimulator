const linewidth = 3;
const minfont = 0.01;

// Button to show websites information and instructions
const infoBtn = document.getElementById("infoBtn");
const infoOverlay = document.getElementById("infoOverlay");
const closeInfo = document.getElementById("closeInfo");

class Rendering {

    static renderingArea = 8000;

    constructor(display) {
        this.display = display
        
        this.tools = document.getElementById("tools");
        this.nameVisibility = document.getElementById("shownames");

        this.viewControls = new ViewControls(this.display);

        // For info buttons
        infoBtn.addEventListener("click", () => {
            infoOverlay.style.display = "flex";
            this.display.timeControls.pause();
        });
        
        closeInfo.addEventListener("click", () => {
            infoOverlay.style.display = "none";
            this.display.timeControls.unPause();
        });
        
        /* Optional: click outside panel to close */
        infoOverlay.addEventListener("click", (e) => {
            if (e.target === infoOverlay) {
                infoOverlay.style.display = "none";
                this.display.timeControls.unPause();
            }
        });
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

// Tools and other stuff

// const debug = document.getElementById("debug");
// function log(text) {
//     debug.innerText = text;
// }

function round(num,precision) {
    return Math.round(num*10**precision)/10**precision;
}

// Move tools up so accessible when sreen width is small and lowerRight buttons with it 
const toggleBtn = document.getElementById("toggleTools");
const tools = document.getElementById("tools");
const lowerRight = document.getElementById("lowerRightButtons");

let toolsOpen = false;

toggleBtn.addEventListener("click", () => {
    toolsOpen = !toolsOpen;

    if (toolsOpen) {
        tools.classList.add("open");
        lowerRight.classList.add("raise");
        toggleBtn.textContent = "▼";
    } else {
        tools.classList.remove("open");
        lowerRight.classList.remove("raise");
        toggleBtn.textContent = "▲";
    }
});