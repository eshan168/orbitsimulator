const gconstant = 6.674 * 10**-11
const scale = 1000000000;

class VelocityVerletSim {

    static defaultTimestep = 1000;
    static currentTimestep = 1000;

    static extraSteps = 5;
    static maxSteps = 8;
    static minSteps = 1;

    constructor(display) {
        this.display = display

        // Inital acceleration calcululations
        for (let i=0; i<this.display.bodies.length-1; i++) {
            for (let j=i+1; j<this.display.bodies.length; j++){
                this.calculateAcceleration2(this.display.bodies[i],this.display.bodies[j]);
            }
        }
    }

    simulateStep() {

        // Update Position based on velocity and previous acceleration
        for (let body of this.display.bodies) {
            if (body.oldAcceleration == null) {
                body.oldAcceleration = [...body.newAcceleration];
            }

            body.position[0] += body.velocity[0] * VelocityVerletSim.currentTimestep + 0.5 * body.oldAcceleration[0] * VelocityVerletSim.currentTimestep**2;
            body.position[1] += body.velocity[1] * VelocityVerletSim.currentTimestep + 0.5 * body.oldAcceleration[1] * VelocityVerletSim.currentTimestep**2;
        }

        // Calculate acceleration based off new position
        for (let i=0; i<this.display.bodies.length-1; i++) {
            for (let j=i+1; j<this.display.bodies.length; j++){
                this.calculateAcceleration2(this.display.bodies[i],this.display.bodies[j]);
            }
        }

        // Update velocity with the average of the old acceleration and acceleration at the new position
        for (let body of this.display.bodies) {
            body.velocity[0] += 0.5 * (body.oldAcceleration[0] + body.newAcceleration[0]) * VelocityVerletSim.currentTimestep;
            body.velocity[1] += 0.5 * (body.oldAcceleration[1] + body.newAcceleration[1]) * VelocityVerletSim.currentTimestep;
            
            body.oldAcceleration = [...body.newAcceleration];
            body.newAcceleration = [0,0];
        }
    }

    gravity(body1,body2) {
        return (body1.mass*body2.mass)/(VelocityVerletSim.realDistance(body1,body2)**2) * gconstant;
    }

    acceleration(body1,body2) {
        let force = this.gravity(body1,body2)
        let distance = this.scaledDistance(body1,body2);
        let b1 = body1.position;
        let b2 = body2.position;

        let b1accel = force/body1.mass * VelocityVerletSim.currentTimestep / scale;
        let b2accel = force/body2.mass * VelocityVerletSim.currentTimestep / scale;

        body1.velocity[0] += (b2[0]-b1[0])/distance * b1accel;
        body1.velocity[1] += (b2[1]-b1[1])/distance * b1accel;
        body2.velocity[0] += (b1[0]-b2[0])/distance * b2accel;
        body2.velocity[1] += (b1[1]-b2[1])/distance * b2accel;
    }

    // Updates the acceleration for only the body1
    calculateAcceleration1(body1,body2) {
        let scaledForce = this.gravity(body1,body2) / scale 
        let distance = VelocityVerletSim.scaledDistance(body1,body2);
        let normalizedVelocity = [(body2.position[0]-body1.position[0])/distance, (body2.position[1]-body1.position[1])/distance];

        let b1accel = [normalizedVelocity[0] * scaledForce/body1.mass, normalizedVelocity[1] * scaledForce/body1.mass];
        body1.newAcceleration[0] += b1accel[0];
        body1.newAcceleration[1] += b1accel[1];
    }

    // Updates the acceleration for both bodies
    calculateAcceleration2(body1,body2) {
        let scaledForce = this.gravity(body1,body2) / scale 
        let distance = VelocityVerletSim.scaledDistance(body1,body2);
        let normalizedVelocity = [(body2.position[0]-body1.position[0])/distance, (body2.position[1]-body1.position[1])/distance];

        let b1accel = [normalizedVelocity[0] * scaledForce/body1.mass, normalizedVelocity[1] * scaledForce/body1.mass];
        let b2accel = [-normalizedVelocity[0] * scaledForce/body2.mass, -normalizedVelocity[1] * scaledForce/body2.mass];

        body1.newAcceleration[0] += b1accel[0];
        body1.newAcceleration[1] += b1accel[1];
        body2.newAcceleration[0] += b2accel[0];
        body2.newAcceleration[1] += b2accel[1];
    }

    static realDistance(body1,body2) {
        let b1 = body1.position;
        let b2 = body2.position;
        return Math.sqrt((b1[0]-b2[0])**2 + (b1[1]-b2[1])**2) * scale;
    }

    static scaledDistance(body1,body2) {
        let b1 = body1.position;
        let b2 = body2.position;
        return Math.sqrt((b1[0]-b2[0])**2 + (b1[1]-b2[1])**2);
    }
}