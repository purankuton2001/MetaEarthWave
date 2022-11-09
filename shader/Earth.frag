varying vec3 vPosition;
uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D earthTexture;
varying vec2 vUv;
uniform float period;
uniform float displaceForce;
uniform vec4 waves[20];

mat2 rotate2D(float angle){
    return mat2(cos(angle),-sin(angle), sin(angle), cos(angle));
}

//noise
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

vec3 Wave(float scale, vec3 center){
    float dist = distance(vPosition, center);
    // Time varying pixel color
    if(dist<=scale*0.6 + 0.1){
        return vec3(smoothstep(0.5, 1.0, fract((dist*20.-iTime))));
    }
    return vec3(0, 0, 0);
}

void main(){
    vec2 uv = gl_FragCoord.xy/iResolution;
    vec3 texture = texture2D(earthTexture, vUv).rgb;
    texture.r += .1;
    vec2 ratioedUV = vec2(vUv.x, vUv.y*iResolution.y/iResolution.x);
    float n = noise(vec3(ratioedUV*100./period+iTime/5., iTime/5.));
    vec2 baseUV = ratioedUV * rotate2D(n*displaceForce);
    vec3 purpleColor = vec3(1,0, 0.933333);
    vec3 waterBlueColor = vec3(0.017496,0.972, 0.908366);
    vec3 color = vec3(mix(purpleColor, waterBlueColor, vec3(noise(vec3(baseUV*100./period+iTime/5.,iTime/5.)))));
    for (int i=0 ; i<3; i++){
        if(waves[i].r != -2.){
            vec3 waveColor = mix(purpleColor, waterBlueColor,waves[i].r/2. + 0.5);
            color += waveColor * Wave(abs(waves[i].r), waves[i].gba);
        }
    }
    gl_FragColor = vec4(texture+color*0.8, 1.0);
}
