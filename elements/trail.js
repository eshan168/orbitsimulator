class Trail {

    static compressedTrailPeriod = 8;

    constructor(body) {

        this.body = body;

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
        this.tempTrail.push(this.body.getPosition());
    }

    clearTrail() {
        this.compressedTrail = [this.body.getPosition()];
        this.tempTrail = [this.body.getPosition()];
    }


    // Make sure trails stay the same length when timestep is increased an decreased
    static adjustTrailsToTime(faster,bodies) {
        let newPeriod = Math.max(1, 8 * VelocityVerletSim.defaultTimestep / Math.abs(VelocityVerletSim.currentTimestep));
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