varying vec3 vPosition;
varying vec2 vUv;
uniform float iTime;
uniform float waveTime;
uniform sampler2D earthTexture;
uniform vec4 waves[40];
uniform vec4 emotionColors[40];
uniform float waveRadii[40];
uniform vec4 waveBlend[40];
uniform float waveKinds[40];
uniform float waveAges[40];
uniform float waveTravelAges[40];
uniform float waveWeights[40];

void main() {
    vec3 p = normalize(vPosition);
    vec3 displacement = vec3(0.);
    vec3 pigment = vec3(0.);
    float density = 0.;
    for (int i=0; i<40; i++) {
        if (waves[i].a != -2.) {
            float strength = abs(waves[i].a);
            float radius = waveRadii[i] > 0. ? waveRadii[i] : .04 + strength*.12;
            vec3 center = normalize(waves[i].xyz);
            float distanceToOrigin = length(p-center);
            // A softer wake travels beyond the colored source, never across the whole globe.
            float wakeRadius = radius + strength*.20;
            if (distanceToOrigin < wakeRadius) {
                float arrival = smoothstep(distanceToOrigin, distanceToOrigin+.04, waveTravelAges[i]*.065);
                float wakeEdge = 1.-smoothstep(radius*.8,wakeRadius,distanceToOrigin);
                float fade = 1.-smoothstep(42.,60.,waveAges[i]);
                vec3 tangent = p-center*dot(p,center);
                tangent /= max(length(tangent),.001);
                vec3 curl = cross(center,tangent);
                float front = sin(distanceToOrigin*42.-waveTime*3.0 + fluidNoise(p*9.)*.6);
                float trailing = cos(distanceToOrigin*29.-waveTime*2.0);
                float influence = arrival*wakeEdge*fade*strength*waveWeights[i];
                displacement += (tangent*front*.055+curl*trailing*.032)*influence;
            }
            // Colored source remains strictly local.
            if (distanceToOrigin < radius) {
                vec3 axis = abs(center.y) > .95 ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
                vec3 east = normalize(cross(axis,center));
                vec3 north = normalize(cross(center,east));
                vec2 q = vec2(dot(p-center,east),dot(p-center,north))/radius;
                float t = waveTime;
                float kind = waveKinds[i];
                float fade = 1.-smoothstep(42.,60.,waveAges[i]);
                float radial = distanceToOrigin/radius;
                float edge = 1.-smoothstep(.58,1.,radial);
                vec2 outward = q/max(length(q),.001);
                // Soft moving fronts, warped by the fluid instead of geometric rings.
                float warp = fluidNoise(vec3(q*3.,t*.65))-.5;
                float speed = kind < 1.5 && kind > .5 ? .62 : (kind > 1.5 && kind < 2.5 ? 1.45 : 1.05);
                float phase = radial*2.0 - t*speed + warp*.38;
                float crest = pow(.5+.5*cos(6.2831853*phase),3.);
                float wake = pow(.5+.5*cos(6.2831853*(phase+.13)),2.);
                float propagation = .08 + crest*.78 + wake*.14;
                // Irregular dye diffusion, with no dark disc or geometric outline.
                float filaments = flowField(p*18.+vec3(0.,t*.12,0.),t*.3);
                float mask = edge*fade*strength*waveWeights[i];
                vec2 current = vec2(-q.y,q.x)*.6;
                if (kind < .5) {
                    current += vec2(sin(q.y*4.-t*1.1)*.6, .65+.25*cos(q.x*3.+t));
                } else if (kind < 1.5) {
                    current = vec2(sin(q.y*3.+t*.3)*.18,-.7)*( .6+.4*filaments);
                } else if (kind < 2.5) {
                    current = vec2(-q.y,q.x)*1.7 + vec2(sin(q.y*8.+t*1.5),cos(q.x*7.-t*1.2))*.45;
                } else if (kind < 3.5) {
                    current += vec2(sin(q.y*11.+t*1.7),cos(q.x*13.-t*1.3))*.35;
                } else {
                    current = vec2(-q.y,q.x)*.85 + vec2(sin(q.y*2.+t*.45),cos(q.x*2.-t*.45))*.35;
                }
                if (kind > 4.5) {
                    vec4 blend = waveBlend[i];
                    float empathy = max(0.,1.-dot(blend,vec4(1.)));
                    vec2 swirl = vec2(-q.y,q.x);
                    current = blend.x*vec2(sin(q.y*4.-t*1.1)*.6,.65+.25*cos(q.x*3.+t))
                        + blend.y*vec2(sin(q.y*3.+t*.3)*.18,-.7)
                        + blend.z*(swirl*1.7+vec2(sin(q.y*8.+t*1.5),cos(q.x*7.-t*1.2))*.45)
                        + blend.w*(swirl*.6+vec2(sin(q.y*11.+t*1.7),cos(q.x*13.-t*1.3))*.35)
                        + empathy*(swirl*.85+vec2(sin(q.y*2.+t*.45),cos(q.x*2.-t*.45))*.35);
                }
                // Push the shared flow outwards at the advancing front; curl its wake.
                current = outward*(crest*1.3-wake*.25) + current*(.25+wake*.55);
                displacement += (east*current.x+north*current.y)*mask*.11;
                vec3 dye = kind < -.5 ? mix(vec3(.68,.18,.49),vec3(.18,.78,.78),waves[i].a*.5+.5) : emotionColors[i].rgb;
                float dyeFlow = flowField(vec3(q*2.8-outward*t*.85,t*.28),t*.5);
                float dyeAmount = mask*propagation*(.5+.5*smoothstep(.25,.70,dyeFlow));
                pigment += dye*dyeAmount;
                density += dyeAmount;
            }
        }
    }
    // Local emotions bend the same field that is already flowing over the globe.
    vec3 advected = p+displacement;
    vec3 ambientCurrent = vec3(sin(p.y*3.+iTime*.42),cos(p.z*3.-iTime*.35),sin(p.x*3.+iTime*.38))*.035;
    float field = flowField((advected+ambientCurrent)*4.5,iTime*.85);
    vec3 liquid = fluidPalette(field);
    float silk = (1.-smoothstep(0.,.02,abs(field-.57)));
    liquid += vec3(.13,.25,.27)*silk*.22;
    if (density > .0001) liquid = mix(liquid,pigment/density, min(.8,density*2.8));
    vec3 earth = texture2D(earthTexture,vUv).rgb;
    // Original additive color treatment keeps the globe bright and luminous.
    earth.r += .1;
    vec3 result = earth + liquid*.8 + pigment*.22;
    gl_FragColor = vec4(result,1.);
}
