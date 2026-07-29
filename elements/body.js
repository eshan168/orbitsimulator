class Body {

    // {radius=10, mass=1, x=0,y=0,velocity=[0,0],color="white"}
    // new Body({radius: 10, mass: 1, x: 0,y: 0,velocity: [0,0],color: "white"})

    constructor({name="",radius=10,mass=1,position=[0,0],velocity=[0,0],color="white"} = {}) {

        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.color = color;

        this.velocity = [velocity[0]/scale, velocity[1]/scale];
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

    getScalevelocity() {
        return [this.velocity[0]*currentTimestep, this.velocity[1]*currentTimestep]
    }

    getScaleVelocity() {
        return Math.sqrt(this.velocity[0]*currentTimestep**2 + this.velocity[1]*currentTimestep**2);
    }

    getPosition() {
        return [this.position[0],this.position[1]]
    }
}