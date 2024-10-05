import * as THREE from "three";
import { useState, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import System1 from "./System1";
import { useCameraControl } from "./CameraControlContext";

export default function ComputerScreen({ isLookingAtComputer }) {
  const [textTexture, setTextTexture] = useState();
  const { zoomOut, runEnvBuild } = useCameraControl();
  const screenRef = useRef();
  const meshRef = useRef();
  const htmlRef = useRef();

  const { camera, size } = useThree();
  const [screenDimensions, setScreenDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  // useEffect(() => {
  //   if (htmlRef.current) {
  //     // Traverse up the DOM tree to reach the great-grandparent
  //     const wrapper = htmlRef.current.parentElement;
  //     const grandparent = wrapper?.parentElement;
  //     const greatGrandparent = grandparent?.parentElement;

  //     console.log('Great-Grandparent:', greatGrandparent);

  //     if (greatGrandparent && greatGrandparent.style.pointerEvents === 'none') {
  //       // Set pointer-events to auto for the great-grandparent
  //       greatGrandparent.style.pointerEvents = 'auto';
  //       grandparent.style.pointerEvents = 'auto';

  //       // Optional: Force repaint to ensure Safari processes the change
  //       greatGrandparent.style.display = 'none';
  //       greatGrandparent.offsetHeight; // Trigger a reflow
  //       greatGrandparent.style.display = '';
  //     }
  //   }
  // }, [isLookingAtComputer]);

  useEffect(() => {
    let currentElement = htmlRef.current;
    while (currentElement) {
      currentElement.addEventListener('click', (e) => {
        console.log('Element clicked:', currentElement);
      });
      currentElement = currentElement.parentElement;
    }
  }, []);
  
  

  useFrame(({ clock }) => {
    if (screenRef.current && screenRef.current.uniforms) {
      screenRef.current.uniforms.time.value = clock.getElapsedTime();
    }

    if (meshRef.current) {
      const vector = new THREE.Vector3();
      const widthHalf = size.width / 2;
      const heightHalf = size.height / 2;

      meshRef.current.updateMatrixWorld();
      vector.setFromMatrixPosition(meshRef.current.matrixWorld);
      vector.project(camera);

      const x = vector.x * widthHalf + widthHalf;
      const y = -(vector.y * heightHalf) + heightHalf;

      const widthVector = new THREE.Vector3(0.33, 0, 0);
      widthVector.applyMatrix4(meshRef.current.matrixWorld);
      widthVector.project(camera);
      const width = Math.abs(widthVector.x * widthHalf - -widthHalf);

      const heightVector = new THREE.Vector3(0, 0.25, 0);
      heightVector.applyMatrix4(meshRef.current.matrixWorld);
      heightVector.project(camera);
      const height = Math.abs(heightVector.y * heightHalf - heightHalf);

      setScreenDimensions({ width, height, x, y });

      const screenCorners = [
        new THREE.Vector3(-0.165, 0.125, 0), // Top-left
        new THREE.Vector3(0.165, 0.125, 0), // Top-right
        new THREE.Vector3(-0.165, -0.125, 0), // Bottom-left
        new THREE.Vector3(0.165, -0.125, 0), // Bottom-right
      ];

      const worldCorners = screenCorners.map((corner) => {
        corner.applyMatrix4(meshRef.current.matrixWorld);
        return worldToScreenCoordinates(corner, camera, size);
      });

      const screenBounds = {
        left: Math.min(...worldCorners.map((c) => c.x)),
        right: Math.max(...worldCorners.map((c) => c.x)),
        top: Math.min(...worldCorners.map((c) => c.y)),
        bottom: Math.max(...worldCorners.map((c) => c.y)),
      };

      setScreenDimensions({
        width: screenBounds.right - screenBounds.left,
        height: screenBounds.bottom - screenBounds.top,
        x: screenBounds.left,
        y: screenBounds.top,
      });
    }
  });

  const worldToScreenCoordinates = (worldPosition, camera, size) => {
    const vector = new THREE.Vector3().copy(worldPosition);
    vector.project(camera);
    return {
      x: (vector.x * 0.5 + 0.5) * size.width,
      y: (-(vector.y * 0.5) + 0.5) * size.height,
    };
  };

  const screenShader = {
    uniforms: {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      htmlTexture: { value: textTexture },
    },
    vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform sampler2D htmlTexture;

        void main() {
        vec2 uv = vUv;

        float alpha = 1.0;

        // // Define screen area
        float screenLeft = 0.0837;
        float screenRight = 0.9592;
        float screenTop = 0.04875;
        float screenBottom = 0.9053;

        // // CRT Curvature
        // uv -= 0.5;
        // uv.x *= 1.0 + pow(uv.y, 2.0) * 0.05;
        // uv.y *= 1.0 + pow(uv.x, 2.0) * 0.05;
        // uv += 0.5;

        bool withinScreenArea = uv.x > screenLeft && uv.x < screenRight && uv.y > screenTop && uv.y < screenBottom;

        // Adjust UV for HTML texture
        vec2 htmlUV = (uv - vec2(screenLeft, screenTop)) / vec2(screenRight - screenLeft, screenBottom - screenTop);
        htmlUV = clamp(htmlUV, 0.0, 1.0); // Ensure UV is within 0 to 1 range

        // Sample HTML texture
        vec4 htmlColor = texture2D(htmlTexture, htmlUV);
        

         vec3 color = vec3(0.21, 0.24, 0.23); // Default to black outside screen area

        // Apply HTML texture within screen area
        if (withinScreenArea) {
            color = htmlColor.rgb;
        }

        if (withinScreenArea) {
            vec4 htmlColor = texture2D(htmlTexture, htmlUV);

            // Desaturate the color
            float gray = dot(htmlColor.rgb, vec3(0.399, 0.687, 0.214));
            vec3 desaturatedColor = mix(htmlColor.rgb, vec3(gray), 0.7); // Adjust the mix value to control desaturation level

            // Reduce brightness
            vec3 fadedColor = desaturatedColor * 0.7; // Adjust the multiplier to control brightness

            // Add slight color tint (example: warm yellow)
            vec3 tint = vec3(.3, 1.0, 1.3); // Adjust the tint color as needed
            color = mix(fadedColor, tint, 0.3); // Adjust the mix value to control the amount of tint
            alpha = 0.1;
        }

        // float linePosition = 1.0 - mod(time * 0.23, 1.0); // Adjust speed as needed
        // float lineThickness = 0.0054; // Adjust thickness as needed
        // float lineIntensity = withinScreenArea ? smoothstep(linePosition - lineThickness, linePosition, uv.y) 
        //                         - smoothstep(linePosition, linePosition + lineThickness, uv.y) : 0.0;

        // Scane Lines
        float scanline =  withinScreenArea ? sin(uv.y * 1370.0) * 0.5 : 0.0; // Adjust scanline frequency and intensity for comfort

        // Scanline effect
        if (withinScreenArea) {
            float scanline = sin(uv.y * 1370.0) * 0.5;
            color *= 1.0 - scanline;
        }

        // color += lineIntensity * vec3(0.1, 0.1, 0.1); 

        gl_FragColor = vec4(color, alpha);
    }
`,
    transparent: true,
  };

  const material = new THREE.ShaderMaterial(screenShader);
  material.uniforms.resolution.value.x = window.innerWidth;
  material.uniforms.resolution.value.y = window.innerHeight;

  return (
    <>
      <mesh
        ref={meshRef}
        position={[-0.0068, 0.345, 0.13]}
        rotation={[-0.1, 0, 0]}
        material={material}
      >
        <planeGeometry args={[0.33, 0.25]} />
        <shaderMaterial
          ref={screenRef}
          attach="material"
          args={[screenShader]}
        />
        <Html
          ref={htmlRef}
          className="html-content"
          wrapperClass="html-wrapper-custom"
          position={[0.0071, -0.0058, -0.0001]}
          scale={[0.0113, 0.01254, 1.0]}
          transform
          occlude="blending"
        >
          <DndProvider backend={HTML5Backend} >
            <System1
              zoomOut={zoomOut}
              runEnvBuild={runEnvBuild}
              isLookingAtComputer={isLookingAtComputer}
              screenDimensions={screenDimensions}
            />
          </DndProvider>
        </Html>
      </mesh>
    </>
  );
};