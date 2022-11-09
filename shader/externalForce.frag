
uniform sampler2D velocity;
uniform vec2 force;
uniform vec2 fboSize;
uniform vec2 mousePos;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    vec2 st = gl_FragCoord.xy / fboSize;
//    vec4 oldVel = texture2D(velocity, st);

    // マウス中心ほど強くなる円形
    float intensity = 1.0 - min(length(mousePos- st), 1.0);
    // uv地点でのマウスの大きさを速度に足すだけ
    outputColor = vec4(1,0, 0, 1);
}