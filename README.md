Creator: Eshan Reddy

This mobile friendly 2D interactive gravity simulator is a real-time physics sandbox that lets you explore orbital mechanics, gravitational interactions, and motion in space. You can create celestial bodies, adjust their position and velocity, and observe how they influence each other through gravity. Built using HTML5 Canvas and JavaScript, it includes dynamic zooming, body focusing, velocity visualization, and full control over object properties such as velocity, position, and mass. This is for students, educators, and anyone who wants to explore and experiment with space physics and orbital mechanics interactively.

Simlulation Math:

The simulation uses the Velocity Verlet numerical integration method to update the positions and velocities of bodies over time. Velocity Verlet is specifically useful for orbital simulations because it provides good long-term stability while preserving the behavior of systems involving gravitational forces.

For each simulation step, the position is first updated using the body's velocity and current acceleration:

x(t + Δt) = x(t) + v(t)Δt + ½a(t)Δt²

The simulator then recalculates the gravitational acceleration using the body's new positions. The velocity is then updated using the average of the acceleration from the previous position and the newly calculated acceleration:

v(t + Δt) = v(t) + ½[a(t) + a (t + Δt)]Δt

A more common simpler numerical integration method is Euler's method. Euler's method updates both position and velocity using only the acceleration and velocity at the beginning of each time step:

v(t + Δt) = v(t) + a(t)Δt
x(t + Δt) = x(t) + v(t)Δt

While Euler's method is simple and slighty less computationally expensive, it is not well suited for long-running orbital simulations. It is only first-order accurate O(Δt), using the current velocity to update position and the current acceleration to update velocity.

This means it does not account for how velocity and acceleration change throughout each timestep, so numerical errors can accumulate and causing the system to gain or lose energy over time. In contrast, Velocity Verlet is second-order accurate O(Δt²) as it factors in the acceleration changing over that interval. It's also simplistic which means the total energy usually oscillates around the true energy rather than systematically growing or shrinking.

How to Use the Gravity Simulator

Creating Bodies:
Use the "Create Body" tools to add new objects to the simulation. Select a body type, then create to place it in the middle of the sandbox. The simluator will be paused so you can adjust it's position and velocity before unpausing.

Adjusting Position and Velocity:
Click on a body to select it. You can drag it to change its position or adjust its velocity by dragging the velocity arrow. Or you can input specific values using the input fields for more precise control.

Camera Controls:
Use your mouse or touch gestures to pan and zoom around the simulation. You can also select a body from the focus menu to lock the camera onto it.

Editing and Deleting:
Select a body by either clicking it or selecting its name from the drop down menu. Then use the modify tools to update body properties, remove objects from the simulation, or clear trails to reset visual paths.

Mobile Controls:
On smaller screens, use the toggle arrow to open the tools panel. The interface is optimized for touch, including drag interactions and pinch-style navigation.

Code architecture:
Uses modularity to be easily maintainable and easy to add new feature to certain components.

Main Display Class
  - Simulation logic and math
  - Rendering bodies and trails
  - User interaction with sandbox (zooming, panning, adjusting bodies, creating bodies)

If you wanted to change the type of integration from velocity Verlet to something else, it's simple to add the new simulator logic without affecting the rest of the program.
