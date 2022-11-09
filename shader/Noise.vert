varying vec3 vPosition;

void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelMatrix * viewMatrix * vec4(position, 1);
}
