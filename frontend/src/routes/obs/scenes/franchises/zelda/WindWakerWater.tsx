/**
 * Wind Waker toon-water surface, rendered with a WebGL fragment shader.
 *
 * Implements the classic toon-water look — a sea of overlapping circular
 * blobs with sinusoidal parallax distortion so the surface continuously
 * wobbles and ripples instead of scrolling as a flat pattern.
 *
 * Two passes per frame:
 *   1. A blob pattern mixes a slightly brighter "highlight" water tone
 *      onto a darker base — the irregular cell-shaded water variation.
 *   2. The same pattern, sampled at inverted UVs, mixes a near-white foam
 *      tone in the gaps — what shows up as the white-water flecks.
 *
 * Both passes use the same UV distortion (driven by two sinusoids running at
 * different time scales), so the whole surface wobbles in a wave-like motion.
 *
 * The fragment shader, vertex shader, circle positions, radii, distortion
 * coefficients, and animation timing are all written from scratch — the
 * technique is the same approach common to 2D cel-shaded ocean shaders.
 */

import { useEffect, useRef } from 'react';

const VERTEX_SHADER = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/*
 * Fragment shader: port of "Wind Waker Ocean" by @Polyflare
 *   https://www.shadertoy.com/view/ltfGD7
 * Licensed under Creative Commons Attribution 4.0 International (CC-BY 4.0).
 *
 * Adapted to GLSL ES (WebGL 1) with iTime/iResolution replaced by uniforms
 * and the 3D camera/sky portion stripped out — only the 2D water pass is
 * needed because the canvas is overlaid on the existing scene background.
 */
const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform vec2  u_resolution;
uniform float u_time;

#define WATER_COL  vec3(0.0,    0.4453, 0.7305)
#define WATER2_COL vec3(0.0,    0.4180, 0.6758)
#define FOAM_COL   vec3(0.8125, 0.9609, 0.9648)
// Atmospheric haze tone — matches the scene's #a3f1ee horizon band so the
// distant water blends smoothly into the sky's fog.
#define FOG_COL    vec3(0.6406, 0.9453, 0.9336)

#define M_2PI 6.283185307
#define M_6PI 18.84955592

float circ(vec2 pos, vec2 c, float s) {
  c = abs(pos - c);
  c = min(c, 1.0 - c);
  return smoothstep(0.0, 0.002, sqrt(s) - sqrt(dot(c, c))) * -1.0;
}

float waterlayer(vec2 uv) {
  uv = mod(uv, 1.0);
  float ret = 1.0;
  ret += circ(uv, vec2(0.37378,   0.277169),  0.0268181);
  ret += circ(uv, vec2(0.0317477, 0.540372),  0.0193742);
  ret += circ(uv, vec2(0.430044,  0.882218),  0.0232337);
  ret += circ(uv, vec2(0.641033,  0.695106),  0.0117864);
  ret += circ(uv, vec2(0.0146398, 0.0791346), 0.0299458);
  ret += circ(uv, vec2(0.43871,   0.394445),  0.0289087);
  ret += circ(uv, vec2(0.909446,  0.878141),  0.028466);
  ret += circ(uv, vec2(0.310149,  0.686637),  0.0128496);
  ret += circ(uv, vec2(0.928617,  0.195986),  0.0152041);
  ret += circ(uv, vec2(0.0438506, 0.868153),  0.0268601);
  ret += circ(uv, vec2(0.308619,  0.194937),  0.00806102);
  ret += circ(uv, vec2(0.349922,  0.449714),  0.00928667);
  ret += circ(uv, vec2(0.0449556, 0.953415),  0.023126);
  ret += circ(uv, vec2(0.117761,  0.503309),  0.0151272);
  ret += circ(uv, vec2(0.563517,  0.244991),  0.0292322);
  ret += circ(uv, vec2(0.566936,  0.954457),  0.00981141);
  ret += circ(uv, vec2(0.0489944, 0.200931),  0.0178746);
  ret += circ(uv, vec2(0.569297,  0.624893),  0.0132408);
  ret += circ(uv, vec2(0.298347,  0.710972),  0.0114426);
  ret += circ(uv, vec2(0.878141,  0.771279),  0.00322719);
  ret += circ(uv, vec2(0.150995,  0.376221),  0.00216157);
  ret += circ(uv, vec2(0.119673,  0.541984),  0.0124621);
  ret += circ(uv, vec2(0.629598,  0.295629),  0.0198736);
  ret += circ(uv, vec2(0.334357,  0.266278),  0.0187145);
  ret += circ(uv, vec2(0.918044,  0.968163),  0.0182928);
  ret += circ(uv, vec2(0.965445,  0.505026),  0.006348);
  ret += circ(uv, vec2(0.514847,  0.865444),  0.00623523);
  ret += circ(uv, vec2(0.710575,  0.0415131), 0.00322689);
  ret += circ(uv, vec2(0.71403,   0.576945),  0.0215641);
  ret += circ(uv, vec2(0.748873,  0.413325),  0.0110795);
  ret += circ(uv, vec2(0.0623365, 0.896713),  0.0236203);
  ret += circ(uv, vec2(0.980482,  0.473849),  0.00573439);
  ret += circ(uv, vec2(0.647463,  0.654349),  0.0188713);
  ret += circ(uv, vec2(0.651406,  0.981297),  0.00710875);
  ret += circ(uv, vec2(0.428928,  0.382426),  0.0298806);
  ret += circ(uv, vec2(0.811545,  0.62568),   0.00265539);
  ret += circ(uv, vec2(0.400787,  0.74162),   0.00486609);
  ret += circ(uv, vec2(0.331283,  0.418536),  0.00598028);
  ret += circ(uv, vec2(0.894762,  0.0657997), 0.00760375);
  ret += circ(uv, vec2(0.525104,  0.572233),  0.0141796);
  ret += circ(uv, vec2(0.431526,  0.911372),  0.0213234);
  ret += circ(uv, vec2(0.658212,  0.910553),  0.000741023);
  ret += circ(uv, vec2(0.514523,  0.243263),  0.0270685);
  ret += circ(uv, vec2(0.0249494, 0.252872),  0.00876653);
  ret += circ(uv, vec2(0.502214,  0.47269),   0.0234534);
  ret += circ(uv, vec2(0.693271,  0.431469),  0.0246533);
  ret += circ(uv, vec2(0.415,     0.884418),  0.0271696);
  ret += circ(uv, vec2(0.149073,  0.41204),   0.00497198);
  ret += circ(uv, vec2(0.533816,  0.897634),  0.00650833);
  ret += circ(uv, vec2(0.0409132, 0.83406),   0.0191398);
  ret += circ(uv, vec2(0.638585,  0.646019),  0.0206129);
  ret += circ(uv, vec2(0.660342,  0.966541),  0.0053511);
  ret += circ(uv, vec2(0.513783,  0.142233),  0.00471653);
  ret += circ(uv, vec2(0.124305,  0.644263),  0.00116724);
  ret += circ(uv, vec2(0.99871,   0.583864),  0.0107329);
  ret += circ(uv, vec2(0.894879,  0.233289),  0.00667092);
  ret += circ(uv, vec2(0.246286,  0.682766),  0.00411623);
  ret += circ(uv, vec2(0.0761895, 0.16327),   0.0145935);
  ret += circ(uv, vec2(0.949386,  0.802936),  0.0100873);
  ret += circ(uv, vec2(0.480122,  0.196554),  0.0110185);
  ret += circ(uv, vec2(0.896854,  0.803707),  0.013969);
  ret += circ(uv, vec2(0.292865,  0.762973),  0.00566413);
  ret += circ(uv, vec2(0.0995585, 0.117457),  0.00869407);
  ret += circ(uv, vec2(0.377713,  0.00335442),0.0063147);
  ret += circ(uv, vec2(0.506365,  0.531118),  0.0144016);
  ret += circ(uv, vec2(0.408806,  0.894771),  0.0243923);
  ret += circ(uv, vec2(0.143579,  0.85138),   0.00418529);
  ret += circ(uv, vec2(0.0902811, 0.181775),  0.0108896);
  ret += circ(uv, vec2(0.780695,  0.394644),  0.00475475);
  ret += circ(uv, vec2(0.298036,  0.625531),  0.00325285);
  ret += circ(uv, vec2(0.218423,  0.714537),  0.00157212);
  ret += circ(uv, vec2(0.658836,  0.159556),  0.00225897);
  ret += circ(uv, vec2(0.987324,  0.146545),  0.0288391);
  ret += circ(uv, vec2(0.222646,  0.251694),  0.00092276);
  ret += circ(uv, vec2(0.159826,  0.528063),  0.00605293);
  return max(ret, 0.0);
}

vec3 water(vec2 uv) {
  uv *= vec2(0.25);

  // Two sinusoids drive a wobbly UV distortion so the pattern ripples in
  // place instead of merely scrolling.
  float d1 = mod(uv.x + uv.y, M_2PI);
  float d2 = mod((uv.x + uv.y + 0.25) * 1.3, M_6PI);
  d1 = u_time * 0.07 + d1;
  d2 = u_time * 0.5  + d2;
  vec2 dist = vec2(
    sin(d1) * 0.15 + sin(d2) * 0.05,
    cos(d1) * 0.15 + cos(d2) * 0.05
  );

  vec3 ret = mix(WATER_COL, WATER2_COL, waterlayer(uv + dist.xy));
  ret = mix(ret, FOAM_COL, waterlayer(vec2(1.0) - uv - dist.yx));
  return ret;
}

void main() {
  // Centre origin and normalise by canvas height so coordinates are
  // aspect-correct. fc.x runs ±aspect/2; fc.y runs -0.5 (canvas bottom,
  // closest to viewer) to +0.5 (canvas top, at the horizon).
  vec2 fc = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

  // Ray-vs-plane shortcut: world distance to the water at a given screen
  // row goes as cameraHeight / (angle below horizon). Putting the math
  // horizon well above the canvas top simulates a high vantage point —
  // the canvas only ever shows the wedge of water between the camera's
  // feet and a finite distance, never quite reaching the true horizon,
  // so the foam pattern stays large and uniformly visible across the
  // whole canvas instead of compressing to nothing at the skyline.
  float horizonY = 0.78;
  float cameraHeight = 35.0;
  float belowHorizon = max(horizonY - fc.y, 0.04);

  // worldZ: small near the bottom (close water), large near the top (far).
  float worldZ = cameraHeight / belowHorizon;
  // World X scales with depth — points further away occupy fewer pixels.
  float worldX = fc.x * worldZ;

  // Final scale controls how many tiles span the screen. Tuned so the
  // foam reads in roughly Wind Waker proportions across the whole canvas.
  vec2 worldUV = vec2(worldX, worldZ) * 0.35;

  vec3 col = water(worldUV);

  // Atmospheric perspective: blend the water toward FOG_COL as worldZ
  // grows. Foreground (low worldZ) stays crisp; mid-distance gets a
  // gentle haze; the horizon fades almost entirely into the sky tone so
  // the waterline reads as a soft, less-defined edge rather than a hard
  // pattern boundary.
  float fogStart = cameraHeight * 0.9;
  float fogEnd   = cameraHeight * 3.2;
  float fog = clamp((worldZ - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  // Smoothstep gives the haze a softer ramp than a linear lerp.
  fog = smoothstep(0.0, 1.0, fog);
  // Cap the mix so even the far edge keeps a hint of water tone.
  col = mix(col, FOG_COL, fog * 0.85);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('WW shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function WindWakerWater() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      console.warn('WW shader: WebGL not available, falling back to plain blue water.');
      canvas.style.background = '#006bac';
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('WW shader link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');

    let raf = 0;
    const start = performance.now();

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(resLoc, w, h);
      gl.uniform1f(timeLoc, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="ww-water-canvas" aria-hidden="true" />;
}
