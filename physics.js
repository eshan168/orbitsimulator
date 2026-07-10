const gconstant = 6.674 * 10**-11
const scale = 1000000000;

const maxspeed = 600000;
const minspeed = 50;

const linewidth = 3;
const minfont = 0.01;

class Body {

    // {radius=10, mass=1, x=0,y=0,vector=[0,0],color="white"}
    // new Body({radius: 10, mass: 1, x: 0,y: 0,vector: [0,0],color: "white"})

    constructor({name="",radius=10,mass=1,position=[0,0],vector=[0,0],color="white"} = {}) {

        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.color = color;

        this.vector = [vector[0]/scale, vector[1]/scale];
        this.prevPostion = position;
        this.position = position;
        this.oldAcceleration = null;
        this.newAcceleration = [0,0];

        this.textoffset = this.radius + 5;
        this.font = "10px Arial";

        this.trail = new Trail(this);
    }

    move(x,y) {
        this.position[0] += x;
        this.position[1] += y;
    }

    getScaleVector() {
        return [this.vector[0]*currentTimestep, this.vector[1]*currentTimestep]
    }

    getScaleVelocity() {
        return Math.sqrt(Math.pow(this.vector[0]*currentTimestep, 2) + Math.pow(this.vector[1]*currentTimestep, 2));
    }

    getPosition() {
        return [this.position[0],this.position[1]]
    }
}

class Trail {

    static compressedTrailPeriod = 8;

    constructor(body,timeControls) {

        this.body = body;
        this.timeControls = timeControls;

        // tempTrail stores the last (compressedTrailPeriod) positions so there's a smooth path coming out fo the planet
        // Once tempTrail reaches a certain length add the last point to compressed Trail and clear tempTrail to prevent the list from getting to long
        this.trailLength = 500;
        this.compressedTrail = [this.body.getPosition()];
        this.tempTrail = [this.body.getPosition()];

        this.color = body.color.substring(0, body.color.indexOf(",", 8)+1);
        for (let i = body.color.indexOf(",", 8)+1; i < body.color.length; i++) {
            if (body.color[i] == "%") {
                this.color += " 75%" + body.color.substring(i+1, body.color.length);
                break;
            }
        }
    }

    updatetrail() {
        if (this.tempTrail.length >= Trail.compressedTrailPeriod) {
            this.compressedTrail.push(this.tempTrail[this.tempTrail.length-1]);
            this.tempTrail = [];
        }
        if (this.compressedTrail.length >= this.trailLength ) {
            this.compressedTrail.shift();
        }
        // if (!this.timeControls.paused) {
        //     this.tempTrail.push(this.body.getPosition());
        // }
        this.tempTrail.push(this.body.getPosition());
    }

    clearTrail() {
        this.compressedTrail = [this.body.getPosition()];
        this.tempTrail = [this.body.getPosition()];
    }


    // Make sure trails stay the same length when timestep is increased an decreased
    static adjustTrailsToTime(faster,bodies) {
        let newPeriod = Math.max(1, 8 * VelocityVerletSim.defaultTimestep / VelocityVerletSim.currentTimestep);
        if (newPeriod == Trail.compressedTrailPeriod && faster) {
            for (let body of bodies) {
                body.trail.trailLength /= 2;
            }
            this.decreaseCompressedLengths(bodies);
        }
        else if (newPeriod == Trail.compressedTrailPeriod && !faster) {
            for (let body of bodies) {
                body.trail.trailLength *= 2;
            }
            this.increaseCompressedLengths(bodies);
        }
        else if (!faster) {
            this.increaseTempLengths(bodies);
        }
        else if (faster) {
            this.decreaseTempLengths(bodies);
        }
        Trail.compressedTrailPeriod = newPeriod;
    }

    // Double length of compressed trail
    static increaseCompressedLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.compressedTrail.length-1; i+=1) {
                newlist.push(body.trail.compressedTrail[i]);
                let midpoint = [(body.trail.compressedTrail[i][0]+body.trail.compressedTrail[i+1][0])/2, (body.trail.compressedTrail[i][1]+body.trail.compressedTrail[i+1][1])/2];
                newlist.push(midpoint);
            }
            body.trail.compressedTrail = newlist;
        }
    }

    // Half length of compressed trail
    static decreaseCompressedLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.compressedTrail.length-1; i+=2) {
                newlist.push(body.trail.compressedTrail[i]);
            }
            body.trail.compressedTrail = newlist;
        }
    }

    // When timeStep is decreased double tempTrail by adding midpoints between points
    static increaseTempLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.tempTrail.length-1; i+=1) {
                newlist.push(body.trail.tempTrail[i]);
                let midpoint = [(body.trail.tempTrail[i][0]+body.trail.tempTrail[i+1][0])/2, (body.trail.tempTrail[i][1]+body.trail.tempTrail[i+1][1])/2];
                newlist.push(midpoint);
            }
            body.trail.tempTrail = newlist;
        }
    }

    // When timeStep is increased half tempTrail by deleting every other point
    static decreaseTempLengths(bodies) {
        for (let body of bodies) {
            let newlist = [];
            for (let i=0; i<body.trail.tempTrail.length-1; i+=2) {
                newlist.push(body.trail.tempTrail[i]);
            }
            body.trail.tempTrail = newlist;
        }
    }
}

class VelocityVerletSim {

    static defaultTimestep = 1000;
    static currentTimestep = 1000;

    static extraSteps = 5;
    static maxSteps = 8;
    static minSteps = 1;

    constructor(bodies) {
        this.bodies = bodies

        // Inital acceleration calcululations
        for (let i=0; i<this.bodies.length-1; i++) {
            for (let j=i+1; j<this.bodies.length; j++){
                this.calculateAcceleration2(this.bodies[i],this.bodies[j]);
            }
        }
    }

    simulateStep() {

        // Update Position based on velocity and previous acceleration
        for (let body of this.bodies) {
            if (body.oldAcceleration == null) {
                body.oldAcceleration = [...body.newAcceleration];
            }

            body.position[0] += body.vector[0] * VelocityVerletSim.currentTimestep + 0.5 * body.oldAcceleration[0] * Math.pow(VelocityVerletSim.currentTimestep, 2);
            body.position[1] += body.vector[1] * VelocityVerletSim.currentTimestep + 0.5 * body.oldAcceleration[1] * Math.pow(VelocityVerletSim.currentTimestep, 2);
        }

        // Calculate acceleration based off new position
        for (let i=0; i<this.bodies.length-1; i++) {
            for (let j=i+1; j<this.bodies.length; j++){
                this.calculateAcceleration2(this.bodies[i],this.bodies[j]);
            }
        }

        // Update velocity with the average of the old acceleration and acceleration at the new position
        for (let body of this.bodies) {
            body.vector[0] += 0.5 * (body.oldAcceleration[0] + body.newAcceleration[0]) * VelocityVerletSim.currentTimestep;
            body.vector[1] += 0.5 * (body.oldAcceleration[1] + body.newAcceleration[1]) * VelocityVerletSim.currentTimestep;
            
            body.oldAcceleration = [...body.newAcceleration];
            body.newAcceleration = [0,0];
        }
    }

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

    gravity(body1,body2) {
        return (body1.mass*body2.mass)/(this.realDistance(body1,body2)**2) * gconstant;
    }

    acceleration(body1,body2) {
        let force = this.gravity(body1,body2)
        let distance = this.scaledDistance(body1,body2);
        let b1 = body1.position;
        let b2 = body2.position;

        let b1accel = force/body1.mass * VelocityVerletSim.currentTimestep / scale;
        let b2accel = force/body2.mass * VelocityVerletSim.currentTimestep / scale;

        body1.vector[0] += (b2[0]-b1[0])/distance * b1accel;
        body1.vector[1] += (b2[1]-b1[1])/distance * b1accel;
        body2.vector[0] += (b1[0]-b2[0])/distance * b2accel;
        body2.vector[1] += (b1[1]-b2[1])/distance * b2accel;
    }

    // Updates the acceleration for only the body1
    calculateAcceleration1(body1,body2) {
        let scaledForce = this.gravity(body1,body2) / scale 
        let distance = this.scaledDistance(body1,body2);
        let normalizedVector = [(body2.position[0]-body1.position[0])/distance, (body2.position[1]-body1.position[1])/distance];

        let b1accel = [normalizedVector[0] * scaledForce/body1.mass, normalizedVector[1] * scaledForce/body1.mass];
        body1.newAcceleration[0] += b1accel[0];
        body1.newAcceleration[1] += b1accel[1];
    }

    // Updates the acceleration for both bodies
    calculateAcceleration2(body1,body2) {
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

class Adjuster {

    static clickDistance = 10;

    constructor(bodies) {
        this.bodies = body;
        this.body = null;

        addEventListener("mouseup", (event) => this.checkForBody(event));
    }

    checkForBody(event) {

    }
    

    assignBody(body) {
    }
}

// class Collisions {

//     static checkCollision(body1,body2) {
//         let distance = gravity.scaledDistance(body1,body2);
//         return distance < body1.radius + body2.radius;
//     }
// }