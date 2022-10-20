uniform float zoomFactor;
attribute float size;

varying vec4 vColor;

void main() {

    vColor = vec4(color, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_PointSize = size * zoomFactor;

    gl_Position = projectionMatrix * mvPosition;
}