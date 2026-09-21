// Shared continuous flow field for the globe, local disturbances and surroundings.
float fluidHash(vec3 p) {
    p = fract(p * .3183099 + vec3(.11, .27, .39));
    p *= 17.;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float fluidNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.-2.*f);
    return mix(mix(mix(fluidHash(i), fluidHash(i+vec3(1,0,0)),f.x),
                   mix(fluidHash(i+vec3(0,1,0)),fluidHash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(fluidHash(i+vec3(0,0,1)),fluidHash(i+vec3(1,0,1)),f.x),
                   mix(fluidHash(i+vec3(0,1,1)),fluidHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fluidFbm(vec3 p) {
    return fluidNoise(p)*.58 + fluidNoise(p*2.03+3.1)*.28 + fluidNoise(p*4.07+7.8)*.14;
}
float flowField(vec3 p, float t) {
    vec3 drift = vec3(t*.13, -t*.09, t*.07);
    vec3 warp = vec3(fluidFbm(p+drift), fluidFbm(p+vec3(4.7,1.3,8.1)-drift), fluidFbm(p+vec3(1.8,9.2,2.3)+drift));
    return fluidFbm(p*vec3(.75,1.45,.85) + (warp-.5)*2.8 + drift*.4);
}
vec3 fluidPalette(float field) {
    // Preserve the original site's luminous purple and cyan palette.
    vec3 purple = vec3(1., 0., .933333);
    vec3 waterBlue = vec3(.017496, .972, .908366);
    return mix(purple, waterBlue, smoothstep(.18,.82,field));
}
