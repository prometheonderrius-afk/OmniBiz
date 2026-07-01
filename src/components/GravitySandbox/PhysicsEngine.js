// Physics constants
// G in km^3 / (kg * s^2) = 6.67430e-20
export const G = 6.67430e-20;

// Earth: Mass in kg, Radius in km
export const EARTH_MASS = 5.972e24;
export const EARTH_RADIUS = 6371;

// Moon: Mass in kg, Radius in km
export const MOON_MASS = 7.348e22;
export const MOON_RADIUS = 1737;

// Distance in km
export const EARTH_MOON_DISTANCE = 384400;

// Moon orbital velocity in km/s
export const MOON_VELOCITY = 1.022;

export const RENDER_SCALE = 1 / 1000; // 1 unit in Three.js = 1000 km

/**
 * Updates positions and velocities of bodies using Semi-Implicit Euler integration.
 * @param {Array} bodies - Array of body objects { id, mass, radius, position: [x,y,z], velocity: [vx,vy,vz], fixed }
 * @param {number} dt - Time step in seconds
 */
export function updatePhysics(bodies, dt) {
  const forces = bodies.map(() => [0, 0, 0]);
  const collisions = [];

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i];
      const b2 = bodies[j];

      const dx = b2.position[0] - b1.position[0];
      const dy = b2.position[1] - b1.position[1];
      const dz = b2.position[2] - b1.position[2];

      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      // Collision detection
      if (dist < (b1.radius + b2.radius)) {
        collisions.push({
          b1: b1.id,
          b2: b2.id,
          position: [
            b1.position[0] + dx / 2,
            b1.position[1] + dy / 2,
            b1.position[2] + dz / 2,
          ],
          relativeVelocity: Math.sqrt(
            Math.pow(b2.velocity[0] - b1.velocity[0], 2) +
            Math.pow(b2.velocity[1] - b1.velocity[1], 2) +
            Math.pow(b2.velocity[2] - b1.velocity[2], 2)
          )
        });
      }

      if (dist < 1) continue; 

      const forceMag = (G * b1.mass * b2.mass) / distSq;

      const fx = forceMag * (dx / dist);
      const fy = forceMag * (dy / dist);
      const fz = forceMag * (dz / dist);

      forces[i][0] += fx;
      forces[i][1] += fy;
      forces[i][2] += fz;

      forces[j][0] -= fx;
      forces[j][1] -= fy;
      forces[j][2] -= fz;
    }
  }

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if (body.fixed) continue;

    const ax = forces[i][0] / body.mass;
    const ay = forces[i][1] / body.mass;
    const az = forces[i][2] / body.mass;

    body.velocity[0] += ax * dt;
    body.velocity[1] += ay * dt;
    body.velocity[2] += az * dt;

    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
    body.position[2] += body.velocity[2] * dt;
  }

  return collisions;
}
