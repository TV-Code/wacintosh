import * as THREE from "three";
import { useState, useEffect, useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import System1 from "./System1";
import { useCameraControl } from "./CameraControlContext";

// Helper function to get the iOS version from the user agent
function getIOSVersion() {
  const ua = navigator.userAgent;
  const match = ua.match(/OS (\d+)_?(\d+)?/);
  if (match) {
    const majorVersion = parseInt(match[1], 10);
    const minorVersion = match[2] ? parseInt(match[2], 10) : 0;
    return { majorVersion, minorVersion };
  }
  return null;
}

// Function to detect the browser and platform
function getBrowserDetails() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);  // Distinguish Chrome from Edge
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && !isChrome;  // Safari but not Chrome
  const safariVersionMatch = ua.match(/Version\/(\d+(\.\d+)?).*Safari/);
  const safariVersion = safariVersionMatch ? parseFloat(safariVersionMatch[1]) : null;
  const iOSVersion = getIOSVersion();

  return {
    isIOS,
    isChrome,
    isSafari,
    safariVersion,
    iOSVersion,
  };
}

function canUseHtmlComponent(browserDetails) {
  const { isIOS, iOSVersion, isSafari, safariVersion } = browserDetails;

  // If on iOS, check the iOS version (Safari and Chrome on iOS use the same engine)
  if (isIOS) {
    if (iOSVersion && iOSVersion.majorVersion <= 17.7) {
      return false;  // iOS versions 17.7 and below do not support transforms
    }
    return true;  // iOS 17.7 and above
  }

  // If on desktop Safari, check Safari version
  if (isSafari && safariVersion <= 17.6) {
    return false;  // Desktop Safari version 17.6 and below do not support transforms
  }

  // For desktop Chrome, assume transforms are supported
  return true;
}

const HtmlWrapper = ({ isSupported, distanceFactor, isPortrait, children, ...props }) => {
  return isSupported ? (
    <Html {...props} transform occlude="blending">
      {children}
    </Html>
  ) : (
    <Html {...props} distanceFactor={distanceFactor} className={`html-wrapper ${isPortrait ? 'rotated' : ''}`}>
      {children}
    </Html>
  );
};


export default function ComputerScreen({ isLookingAtComputer }) {
  const [textTexture, setTextTexture] = useState();
  const { zoomOut, runEnvBuild } = useCameraControl();
  const screenRef = useRef();
  const meshRef = useRef();
  const htmlRef = useRef();

  const [htmlKey, setHtmlKey] = useState(1);
  const [renderHtml, setRenderHtml] = useState(false);

  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);


  const [isSupported, setIsSupported] = useState(false);
  const [browserDetails, setBrowserDetails] = useState({});
  const { camera, size } = useThree();
  const [screenDimensions, setScreenDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  // Trigger a re-render after mounting
  useEffect(() => {
    if (isLookingAtComputer) {
      const timer = setTimeout(() => {
        setHtmlKey((prevKey) => prevKey + 1);
        setRenderHtml(true);
      }, 750); // Adjust delay as needed

      return () => clearTimeout(timer);
    } else {
      setRenderHtml(false);
    }
  }, [isLookingAtComputer]);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      if (isLookingAtComputer) {
        setHtmlKey((prevKey) => prevKey + 1);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [isLookingAtComputer]);

  useEffect(() => {
    const details = getBrowserDetails();
    setBrowserDetails(details);
    
    const supported = canUseHtmlComponent(details);
    setIsSupported(supported);

    console.log(`Browser Details: `, details);
    console.log(`Is Supported: ${supported}`);
  }, []);

  const distanceFactor = size.height * 0.00028;

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
      isSupported: { value: isSupported }, 
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
        uniform bool isSupported;

        void main() {
        vec2 uv = vUv;

        float alpha = 1.0;

        // // Define screen area
        float screenLeft = isSupported ? 0.0837 : 0.0;
        float screenRight = isSupported ? 0.9592 : 0.0;
        float screenTop = isSupported ? 0.04875 : 0.0;
        float screenBottom = isSupported ? 0.9053 : 0.0;

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
        position={[-0.0068, 0.345, isSupported ? 0.125 : 0.135]}
        rotation={[-0.1, 0, 0]}
        material={material}
      >
        <planeGeometry args={[0.33, 0.25]} />
        {(isSupported || (renderHtml && isLookingAtComputer)) && (
          <HtmlWrapper
          key={htmlKey}
          ref={htmlRef}
          className="html-content"
          position={isSupported ? [0.0071, -0.0058, -0.0001] : [0.0066, -0.006, 0.0]}
          scale={[0.0113, 0.01254, 1.0]}
          center
          isSupported={isSupported}
          distanceFactor={distanceFactor}
          isPortrait={isPortrait}
        >
          <DndProvider backend={HTML5Backend} >
            <System1
              zoomOut={zoomOut}
              runEnvBuild={runEnvBuild}
              isLookingAtComputer={isLookingAtComputer}
              screenDimensions={screenDimensions}
            />
          </DndProvider>
        </HtmlWrapper>
        )}
      </mesh>
    </>
  );
};