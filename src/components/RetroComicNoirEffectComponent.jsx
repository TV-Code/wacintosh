import React, { useEffect, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Vector2, Uniform } from 'three';
import { EffectComposer } from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';

class RetroAnalogEffectImpl extends Effect {
  constructor({ edgeStrength = 0.5 }) {
    super(
      'RetroAnalogEffect',
      `
      // Uniforms
uniform float time;
uniform vec2 resolution;

// Random Function
float random(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Noise Function
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  // Smooth interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);

  // Mix
  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

// Edge Detection Function
float edgeDetection(vec2 uv) {
        vec2 texel = 1.0 / resolution;
        float edge = 0.0;
        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            edge += length(texture2D(inputBuffer, uv + vec2(i, j) * texel).rgb) * (i == 0 && j == 0 ? 8.0 : -1.0);
          }
        }
        return edge;
      }

// Main Effect
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = inputColor;

  // Desaturate and shift towards yellow
  float average = (color.r + color.g + color.b) / 2.5;
  color.rgb = mix(vec3(average), color.rgb, 0.1); // More desaturation
  color.rgb *= vec3(1.0, 0.9, 0.75); // Stronger yellowing

  // Surface imperfections (Noise/Grain)
  float n = noise(uv * resolution.xy * 0.5 + time * 0.05); // Larger grain layer
  color.rgb += n * 0.03;

  float fineGrain = fract(sin(dot(uv * resolution.xy * 2.0 + time * 0.1, vec2(12.9898,78.233))) * 43758.5453);
  color.rgb += fineGrain * 0.07; // Fine grain

  // Scuffs and Scratches
  float scratches = step(0.99, fract(sin(dot(uv * resolution.xy * 7.0 + time * 0.25, vec2(45.123,78.233))) * 43758.5453));
  color.rgb -= scratches * 0.3; // Sharper, more frequent scratches

  // Edge detection for ambient occlusion-like effect
  float edge = edgeDetection(uv);
  color.rgb -= edge * 0.01; // Increased edge detection strength

  // Vignette
  vec2 pos = uv - 0.;
  float vignette = smoothstep(0.7, 0.3, length(pos)); // Stronger vignette
//   color.rgb *= vignette;

  // Soften lighting
  color.rgb = pow(color.rgb, vec3(1.12)); // More aggressive softening

  // Reduce specularity (flatten highlights)
  color.rgb = min(color.rgb, .75); // Further reduce highlights

  // Low-resolution look (Pixelation)
  vec2 pixelSize = vec2(0.01 / resolution.x, 0.01 / resolution.y) * 0.01; // Increased pixelation
  vec2 uvPixelated = floor(uv / pixelSize) * pixelSize;

  // UV Distortion
//   vec2 distortedUv = uvPixelated + n * 0.01; // Stronger distortion
//   color = texture2D(inputBuffer, distortedUv);

  // Apply grain again after pixelation
  color.rgb += fineGrain * 0.04; // Stronger grain after pixelation

  // Custom Color Grading
  color.rgb = vec3(
    color.r * 0.85 + 0.15 * color.g,
    color.g * 0.8 + 0.2 * color.b,
    color.b * 0.75 + 0.25 * color.r
  );

  // Clamp color
  color.rgb = clamp(color.rgb, 0.0, 1.0);

  outputColor = color;
}


      `,
      {
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map([
          ['time', new Uniform(0)],
          ['resolution', new Uniform(new Vector2())],
        ]),
      }
    );
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('time').value += deltaTime;

    const size = renderer.getSize(new Vector2());
    this.uniforms.get('resolution').value.copy(size);
  }
}

const RetroAnalogEffect = forwardRef(({ edgeStrength = 0.5 }, ref) => {
  const effect = useMemo(
    () => new RetroAnalogEffectImpl({ edgeStrength }),
    [edgeStrength]
  );

  useFrame(({ gl }, deltaTime) => {
    effect.update(gl, null, deltaTime);
  });

  return <primitive ref={ref} object={effect} dispose={null} />;
});

const RetroAnalogEffectComponent = ({ edgeStrength = 0.5 }) => {
  return (
    <EffectComposer>
      <RetroAnalogEffect edgeStrength={edgeStrength} />
    </EffectComposer>
  );
};

export default RetroAnalogEffectComponent;