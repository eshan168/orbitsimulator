const gconstant = 6.674 * 10**-11
const scale = 1000000000;

let timestep = 1000;
let extraSteps = 5;

const linewidth = 2;

class Body {

    // {radius=10, mass=1, x=0,y=0,vector=[0,0],color="white"}
    // new Body({radius: 10, mass: 1, x: 0,y: 0,vector: [0,0],color: "white"})

    constructor({name="",radius=10,mass=1,position=[0,0],vector=[0,0],color="white"} = {}) {

        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.color = color;

        this.vector = [vector[0]/scale, vector[1]/scale];
        this.position = position
        this.oldAcceleration = null
        this.newAcceleration = [0,0]

        this.textoffset = this.radius + 5;
        this.font = "10px Arial";
        this.nameVisible = true;

        this.draw();

        this.traillength = 200;
        this.trail = [this.getPosition()];
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.position[0],this.position[1],this.radius,0,Math.PI*2);
        ctx.fill();

        if (this.nameVisible) {
            ctx.fillStyle = "white";
            ctx.font = this.font;
            ctx.fillText(this.name,this.position[0]+this.textoffset,this.position[1]-this.textoffset);
        }
    }

    move() {
        this.position[0] += this.vector[0] * timestep;
        this.position[1] += this.vector[1] * timestep;
        this.draw();
    }

    updatePosition() {
        if (this.oldAcceleration == null) {
            this.oldAcceleration = [...this.newAcceleration];
        }

        this.position[0] += this.vector[0] * timestep + 0.5 * this.oldAcceleration[0] * Math.pow(timestep, 2);
        this.position[1] += this.vector[1] * timestep + 0.5 * this.oldAcceleration[1] * Math.pow(timestep, 2);
    }

    updateVelocity() {
        this.vector[0] += 0.5 * (this.oldAcceleration[0] + this.newAcceleration[0]) * timestep;
        this.vector[1] += 0.5 * (this.oldAcceleration[1] + this.newAcceleration[1]) * timestep;
        
        this.oldAcceleration = [...this.newAcceleration];
        this.newAcceleration = [0,0];
    }

    getScalevector() {
        return [this.vector[0]*timestep, this.vector[1]*timestep]
    }

    getPosition() {
        return [this.position[0],this.position[1]]
    }

    updateAlltrails(bodies) {
        for (let body of bodies) {
            body.updatetrail();
        }
    }

    updatetrail() {
        this.traillength = 200 * 50000 / timestep / extraSteps;
        if (this.trail.length >= this.traillength) {
            this.trail.shift();
        }
        this.trail.push(this.getPosition());
        this.drawtrail();
    }

    increaseLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.length-1; i++) {
                newlist.push(body.trail[i]);
                let midpoint = [(body.trail[i][0]+body.trail[i+1][0])/2, (body.trail[i][1]+body.trail[i+1][1])/2];
                newlist.push(midpoint);
            }
            body.trail = newlist;
        }
    }

    decreaseLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.length-1; i+=2) {
                newlist.push(body.trail[i]);
            }
            body.trail = newlist;
        }
    }

    drawtrail() {
        ctx.beginPath();
        moveTo(this.trail[0][0],this.trail[0][1]);
        for (let point of this.trail) {
            ctx.lineTo(point[0],point[1]);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = toScale(linewidth);
        ctx.stroke();
    }

    updatetext() {
        let minfont = this.radius;

        this.textoffset = (this.radius+5/zoomscale)
        this.font = `${Math.max(10/zoomscale,minfont)}px Arial`;
        // this.font = `${Math.max(10/zoomscale)}px Arial`;
    }
}

class Gravity{
    
    constructor() {};

    realDistance(body1,body2) {
        let b1 = body1.position;
        let b2 = body2.position;
        return Math.sqrt((b1[0]-b2[0])**2 + (b1[1]-b2[1])**2) * scale;
    }

    scaledDistance(body1,body2) {
        let b1 = body1.position;
        let b2 = body2.position;
        return Math.sqrt((b1[0]-b2[0])**2 + (b1[1]-b2[1])**2);
    }

    gravity (body1,body2) {
        return (body1.mass*body2.mass)/(this.realDistance(body1,body2)**2) * gconstant;
    }
    
    acceleration (body1,body2) {
        let force = this.gravity(body1,body2)
        let distance = this.scaledDistance(body1,body2);
        let b1 = body1.position;
        let b2 = body2.position;

        let b1accel = force/body1.mass * timestep / scale;
        let b2accel = force/body2.mass * timestep / scale;

        body1.vector[0] += (b2[0]-b1[0])/distance * b1accel;
        body1.vector[1] += (b2[1]-b1[1])/distance * b1accel;
        body2.vector[0] += (b1[0]-b2[0])/distance * b2accel;
        body2.vector[1] += (b1[1]-b2[1])/distance * b2accel;
    }

    calculateAcceleration (body1,body2) {
        let scaledForce = this.gravity(body1,body2) / scale 
        let distance = this.scaledDistance(body1,body2);
        let normalizedVector = [(body2.position[0]-body1.position[0])/distance, (body2.position[1]-body1.position[1])/distance];

        let b1accel = [normalizedVector[0] * scaledForce/body1.mass, normalizedVector[1] * scaledForce/body1.mass];
        let b2accel = [-normalizedVector[0] * scaledForce/body2.mass, -normalizedVector[1] * scaledForce/body2.mass];

        body1.newAcceleration[0] += b1accel[0];
        body1.newAcceleration[1] += b1accel[1];
        body2.newAcceleration[0] += b2accel[0];
        body2.newAcceleration[1] += b2accel[1];
    }
}