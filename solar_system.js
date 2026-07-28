class Solar_System {
    constructor() {
        let sun = new Body({
            name:"Sun",
            radius:0.696,
            mass:1.989e30,
            position:[0,0],
            velocity:[0,0],
            color:"hsl(51, 98%, 52%)"
        });

        let mercury = new Body({
            name:"Mercury",
            radius:0.0024405,
            mass:3.3010e23,
            position:[-46, 0],
            velocity:[0,58980],
            color:"hsl(0, 9%, 63%)"
        });

        let venus = new Body({
            name:"Venus",
            radius:0.0060518,
            mass:4.8673e24,
            position:[-107.48, 0],
            velocity:[0,35260],
            color:"hsl(40, 100%, 70%)"
        });

        let earth = new Body({
            name:"Earth",
            radius:0.0060518,
            mass:5.972e24,
            position:[-152.1, 0],
            velocity:[0,29290],
            color:"hsl(202, 100%, 41%)"
        });

        let moon = new Body({
            name:"Moon",
            radius:0.0017375,
            mass:7.35e22,
            position:[-152.505, 0],
            velocity:[0,30313.1],
            color:"hsl(0, 0%, 55%)"
        });

        let mars = new Body({
            name:"Mars",
            radius:0.0033962,
            mass:6.4169e23,
            position:[-206.65, 0],
            velocity:[0,26500],
            color:"hsl(27, 100%, 46%)"
        });

        let jupiter = new Body({
            name:"Jupiter",
            radius:0.071492,
            mass:1.89813e27,
            position:[-740.595, 0],
            velocity:[0,13720],
            color:"hsl(33, 100%, 26%)"
        });

        let ganymede = new Body({
            name:"Ganymede",
            radius:0.0026341,
            mass:1.4819e23,
            position:[-741.6642, 0],
            velocity:[0,24600],
            color:"hsl(189, 3%, 57%)"
        });

        let calisto = new Body({
            name:"Calisto",
            radius:0.002410,
            mass:1.075938e23,
            position:[-742.465, 0],
            velocity:[0,22020],
            color:"hsl(53, 19%, 62%)"
        });

        let io = new Body({
            name:"Io",
            radius:0.001821,
            mass:8.931938e22,
            position:[-741.015, 0],
            velocity:[0,31120],
            color:"hsl(72, 60%, 58%)"
        });

        let europa = new Body({
            name:"Europa",
            radius:0.0015608,
            mass:4.79984e22,
            position:[-741.259862, 0],
            velocity:[0,27464],
            color:"hsl(187, 17%, 59%)"
        });

        let saturn = new Body({
            name:"Saturn",
            radius:0.060268,
            mass:5.6851e26,
            position:[-1357.554, 0],
            velocity:[0,10140],
            color:"hsl(51, 100%, 82%)"
        });

        let titan = new Body({
            name:"Titan",
            radius:0.002575,
            mass:1.34518e23,
            position:[-1358.74068, 0],
            velocity:[0,15840],
            color:"hsl(29, 88%, 65%)"
        });


        let uranus = new Body({
            name:"Uranus",
            radius:0.025559,
            mass:8.6849e25,
            position:[-2732.696, 0],
            velocity:[0,7300],
            color:"hsl(174, 100%, 83%)"
        });

        let titania = new Body({
            name:"Titania",
            radius:0.000788,
            mass:3.455e21,
            position:[-2733.1318, 0],
            velocity:[0,10950],
            color:"hsl(20, 1%, 57%)"
        });

        let neptune = new Body({
            name:"Neptune",
            radius:0.024764,
            mass:1.0244e26,
            position:[-4471.05, 0],
            velocity:[0,5470],
            color:"hsl(246, 68%, 44%)"
        });

        let triton = new Body({
            name:"Triton",
            radius:0.0013534,
            mass:2.1389e22,
            position:[-4471.404759, 0],
            velocity:[0,9860],
            color:"hsl(117, 8%, 52%)"
        });

        let pluto = new Body({
            name:"Pluto",
            radius:0.001188,
            mass:1.3025e22,
            position:[-7375.93, 0],
            velocity:[0,3270],
            color:"hsl(9, 5%, 51%)"
        });

        let charon = new Body({
            name:"Charon",
            radius:0.000606,
            mass:1.3025e22,
            position:[-7375.949595, 0],
            velocity:[0,3580],
            color:"hsl(0, 0%, 55%)"
        });

        // let red_dwarf = new Body({name:"Red Dwarf", radius:0.5, mass:10**29, position:[0,-170], velocity:[-10000,0], color:"hsl(9, 84%, 60%)"});
        // let neutron = new Body({name:"Neutron Star", radius:0.2, mass:10**29, position:[0,-175], velocity:[40000,0], color:"hsl(146, 10%, 44%)"});
        
        this.bodies = [sun,mercury,venus,earth,moon,mars,jupiter,ganymede,calisto,io,europa,saturn,titan,uranus,titania,neptune,triton,pluto,charon];
        this.keys = this.bodies.map(b => b.name);
        this.keysToBodies = Object.fromEntries(this.bodies.map(body => [body.name, body]));
    }
}