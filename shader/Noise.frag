uniform vec2 iResolution;
uniform float iTime;
void main() {
    vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
    vec2 current = vec2(sin(uv.y*2.4+iTime*.48),cos(uv.x*2.1-iTime*.39));
    vec2 flowingUV = uv + current*.13;
    float field = flowField(vec3(flowingUV*3.2, .4), iTime*.9);
    vec3 color = fluidPalette(field);
    gl_FragColor = vec4(color,1.);
}
