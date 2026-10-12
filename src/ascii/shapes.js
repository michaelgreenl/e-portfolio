// Ray tests for the solid shapes the objects are built from. Each takes a ray origin o and unit direction d,
// returns the distance to the first hit in front of the origin (Infinity for a miss), and writes the outward
// surface normal into n.

export function sphere(o, d, cx, cy, cz, r, n) {
    const ox = o[0] - cx;
    const oy = o[1] - cy;
    const oz = o[2] - cz;
    const b = ox * d[0] + oy * d[1] + oz * d[2];
    const h = b * b - (ox * ox + oy * oy + oz * oz - r * r);
    if (h < 0) return Infinity;
    const t = -b - Math.sqrt(h);
    if (t <= 0) return Infinity;
    n[0] = (ox + d[0] * t) / r;
    n[1] = (oy + d[1] * t) / r;
    n[2] = (oz + d[2] * t) / r;
    return t;
}

// Open tube around the y axis, from y0 to y1.
export function tube(o, d, r, y0, y1, n) {
    const a = d[0] * d[0] + d[2] * d[2];
    if (a < 1e-9) return Infinity;
    const b = o[0] * d[0] + o[2] * d[2];
    const h = b * b - a * (o[0] * o[0] + o[2] * o[2] - r * r);
    if (h < 0) return Infinity;
    const t = (-b - Math.sqrt(h)) / a;
    const y = o[1] + d[1] * t;
    if (t <= 0 || y < y0 || y > y1) return Infinity;
    n[0] = (o[0] + d[0] * t) / r;
    n[1] = 0;
    n[2] = (o[2] + d[2] * t) / r;
    return t;
}

// Cone with its tip at apex, opening along the unit axis by k units of radius per unit of height, cut between
// heights h0 and h1 from the tip. Seen from inside, as with a dish, the normal faces the viewer.
export function cone(o, d, apex, axis, k, h0, h1, n) {
    const cx = o[0] - apex[0];
    const cy = o[1] - apex[1];
    const cz = o[2] - apex[2];
    const m = 1 + k * k;
    const da = d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2];
    const ca = cx * axis[0] + cy * axis[1] + cz * axis[2];
    const a = 1 - m * da * da;
    const b = cx * d[0] + cy * d[1] + cz * d[2] - m * ca * da;
    const c = cx * cx + cy * cy + cz * cz - m * ca * ca;
    const h = b * b - a * c;
    if (h < 0 || Math.abs(a) < 1e-9) return Infinity;
    const s = Math.sqrt(h);
    const ta = (-b - s) / a;
    const tb = (-b + s) / a;
    for (let r = 0; r < 2; r++) {
        const t = r === 0 ? Math.min(ta, tb) : Math.max(ta, tb);
        const height = ca + t * da;
        if (t <= 0 || height < h0 || height > h1) continue;
        const px = cx + d[0] * t;
        const py = cy + d[1] * t;
        const pz = cz + d[2] * t;
        let nx = px - m * height * axis[0];
        let ny = py - m * height * axis[1];
        let nz = pz - m * height * axis[2];
        const l = Math.hypot(nx, ny, nz) || 1;
        const facing = nx * d[0] + ny * d[1] + nz * d[2] > 0 ? -1 : 1;
        n[0] = (nx / l) * facing;
        n[1] = (ny / l) * facing;
        n[2] = (nz / l) * facing;
        return t;
    }
    return Infinity;
}

// Convex solid bounded by planes [nx, ny, nz, c, ...] with unit normals facing out: inside where n·p + c <= 0.
export function convex(o, d, planes, n) {
    let near = -Infinity;
    let far = Infinity;
    let face = -1;
    for (let p = 0; p < planes.length; p += 4) {
        const dist = planes[p] * o[0] + planes[p + 1] * o[1] + planes[p + 2] * o[2] + planes[p + 3];
        const rate = planes[p] * d[0] + planes[p + 1] * d[1] + planes[p + 2] * d[2];
        if (Math.abs(rate) < 1e-9) {
            if (dist > 0) return Infinity;
            continue;
        }
        const t = -dist / rate;
        if (rate < 0) {
            if (t > near) {
                near = t;
                face = p;
            }
        } else if (t < far) {
            far = t;
        }
        if (near > far) return Infinity;
    }
    if (face < 0 || near <= 0) return Infinity;
    n[0] = planes[face];
    n[1] = planes[face + 1];
    n[2] = planes[face + 2];
    return near;
}

// Planes of a box with center c and half sizes h, for convex().
export const boxPlanes = (c, h) =>
    [
        [1, 0, 0, -c[0] - h[0]],
        [-1, 0, 0, c[0] - h[0]],
        [0, 1, 0, -c[1] - h[1]],
        [0, -1, 0, c[1] - h[1]],
        [0, 0, 1, -c[2] - h[2]],
        [0, 0, -1, c[2] - h[2]],
    ].flat();

// A plane through point p with outward normal v (normalized here), for convex().
export function plane(v, p) {
    const l = Math.hypot(v[0], v[1], v[2]);
    const nx = v[0] / l;
    const ny = v[1] / l;
    const nz = v[2] / l;
    return [nx, ny, nz, -(nx * p[0] + ny * p[1] + nz * p[2])];
}
