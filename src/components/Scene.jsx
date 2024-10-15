import React, { useEffect, useRef, useState } from 'react';
import { OrbitControls, useGLTF, useAnimations, useTexture, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import ComputerScreen from './ComputerScreen';
import { EffectComposer, Outline, Selection, Select } from "@react-three/postprocessing";
import CameraControlContext from './CameraControlContext';


import * as THREE from "three";
import { useThree, useFrame } from '@react-three/fiber';
import RetroAnalogEffectComponent from './RetroComicNoirEffectComponent';

const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

export function Scene(props) {
  const { nodes, animations } = useGLTF('models/scenewcreature.glb');
  const groupRef = useRef();
  const { actions } = useAnimations(animations, groupRef);
  const texture = useTexture("textures/bakedhigh.jpg");
  const creatureTexture = useTexture("textures/bakedcreature.jpg");
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  creatureTexture.flipY = false;
  creatureTexture.colorSpace = THREE.SRGBColorSpace;

  const textureMaterial = new THREE.MeshStandardMaterial({
    map: texture,
  });
  
  const creatureMaterial = new THREE.MeshStandardMaterial({
    map: creatureTexture,
  });
  

  const { gl, camera } = useThree();
  const controls = useRef();

  const [isCameraMoving, setIsCameraMoving] = useState(false);
  const [isLookingAtComputer, setIsLookingAtComputer] = useState(false);
  const [isLookingAtCW, setIsLookingAtCW] = useState(false);
  const [isLookingAtMagazine, setIsLookingAtMagazine] = useState(false);
  const [hover, setHover] = useState(false);
  const [hoverCW, setHoverCW] = useState(false);
  const [hoverMagazine, setHoverMagazine] = useState(false);

  const [isEnvBuilt, setIsEnvBuilt] = useState(false);
  const [showGroup1, setShowGroup1] = useState(false);
  const [showGroup2, setShowGroup2] = useState(false);
  const [showGroup3, setShowGroup3] = useState(false);
  const [showGroup4, setShowGroup4] = useState(false);

  const [showCWText, setShowCWText] = useState(false); // State to control text visibility
  const cWTextAnimation = useSpring({ opacity: showCWText ? 1 : 0, config: { duration: 1000 } });

  const pageTurnedRef = useRef({});
  const isAnimatingRef = useRef(false);

  const [{ cameraPos }, api] = useSpring(() => ({
    cameraPos: camera.position.toArray(),
    config: { mass: 1, tension: 70, friction: 15, precision: 0.0001 },
  }), []);

  useEffect(() => {
    if (controls.current) {
      if (!isEnvBuilt) {
        api.start({
         cameraPos: [0.58, 1.65, -0.3],
         onChange: ({ value }) => {
          camera.position.set(...value.cameraPos);
            controls.current.target.set(0.58, 1.265, -1.55);
            controls.current.object.lookAt(0.58, 1.265, -1.55);
        },
        onRest: () => setIsCameraMoving(false),
        })
        
      }
    }
  }, [controls, isEnvBuilt]);

  useEffect(() => {
    if (isEnvBuilt) {
      const timers = [
        setTimeout(() => setShowGroup1(true), 1000),
        setTimeout(() => setShowGroup2(true), 2000),
        setTimeout(() => setShowGroup3(true), 3000),
        setTimeout(() => setShowGroup4(true), 4000),
      ];
  
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [isEnvBuilt]);

  useEffect(() => {
    gl.autoClear = false;
    gl.setClearColor(0x000000);
    gl.setClearAlpha(0);
    gl.localClippingEnabled = true;
    gl.useLegacyLights = true;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  const handleEnvBuild = () => {
    if (!isEnvBuilt) {
      setIsEnvBuilt(true);
      setIsLookingAtComputer(false);
      const targetPos = [0, 2, 5];
      
      api.start({
        cameraPos: targetPos,
        onChange: () => setIsCameraMoving(true),
        onRest: () => setIsCameraMoving(false)
      });
    }
  }

  const handleAppleIconClick = () => {
    setIsLookingAtComputer(false);
    const targetPos = isEnvBuilt ? [0, 2, 5] : [0.58, 1.65, -0.3];
    
    api.start({
      cameraPos: targetPos,
      onChange: () => setIsCameraMoving(true),
      onRest: () => setIsCameraMoving(false)
    });
};

  const handleComputerClick = () => {
    if (!isLookingAtComputer) {
      const newIsLookingAtComputer = !isLookingAtComputer;
      setIsLookingAtComputer(newIsLookingAtComputer);
      
      const targetPos = [0.58, 1.62, -0.843];
      const IOStargetPos = [0.58, 1.61, -0.843]
      
      api.start({
        cameraPos: isIOS ? IOStargetPos : targetPos,
        onChange: () => setIsCameraMoving(true),
        onRest: () => setIsCameraMoving(false)
      });
  }
};

const handleCreatureWorldClick = () => {
  const newIsLookingAtCW = !isLookingAtCW;
  setIsLookingAtCW(newIsLookingAtCW);
  setShowCWText(newIsLookingAtCW);

  const targetPos = newIsLookingAtCW ? [-1.1, 3.3, -0.31] : [0, 2, 5]; // Adjust these values based on the exact position

  api.start({
    cameraPos: targetPos,
    onChange: () => setIsCameraMoving(true),
    onRest: () => setIsCameraMoving(false)
  });
};

const handleMagazineClick = () => {
  if (!isLookingAtMagazine) {
    const newIsLookingAtMagazine = !isLookingAtMagazine;
    setIsLookingAtMagazine(newIsLookingAtMagazine);

    const targetPos = newIsLookingAtMagazine ? [-.44, 1.3, 0.43] : [0, 2, 5]; // Adjust these values based on the exact position

    api.start({
      cameraPos: targetPos,
      onChange: () => setIsCameraMoving(true),
      onRest: () => setIsCameraMoving(false)
    });
  }
};

// const handlePageTurn = (pageNumber) => {
//   const animationName = `Plane.010Action${pageNumber ? `.${pageNumber.toString().padStart(3, '0')}` : ''}`;
  
//   const action = actions[animationName];
//   if (!action || isAnimatingRef.current) return; // Guard clause if action is not available or animation is in progress

//   if (isLookingAtMagazine) {
//     isAnimatingRef.current = true; // Mark as animating
//     action.clampWhenFinished = true;
//     action.loop = THREE.LoopOnce; // Play the animation only once

//     const pageTurnedKey = `pageTurned${pageNumber}`;
//     // If the page is currently not turned, start the turn animation
//     if (!pageTurnedRef.current[pageTurnedKey]) {
//       action.reset().play(); // Restart the animation from the beginning
//       action.paused = false; // Ensure the animation is playing
//       // Pause the animation halfway for the turn effect
//       setTimeout(() => {
//         action.paused = true;
//         pageTurnedRef.current[pageTurnedKey] = true; // Mark the page as turned
//         isAnimatingRef.current = false;
//       }, 625); // Halfway through the total duration
//     } else {
//       // For unturning, let the animation play from its current state to the end
//       if (action.paused) {
//         action.paused = false; // Resume playing if it was paused
//         // Wait for the rest of the animation to complete before marking it as unturned
//         setTimeout(() => {
//           pageTurnedRef.current[pageTurnedKey] = false; // Mark the page as unturned
//           isAnimatingRef.current = false;
//         }, 625); // Time left to complete the animation from its halfway point
//       }
//     }
//   }
// };

useFrame(() => {
  if (isCameraMoving) {
    const targetPos = cameraPos.get();
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.1);
    const computerPositionHeight = isIOS ? 1.51 : 1.53;
    if (isLookingAtComputer) {
      const computerPosition = new THREE.Vector3(0.58, computerPositionHeight, -1.877);
      controls.current.target.copy(computerPosition);
      controls.current.object.lookAt(computerPosition);
    } else if (isLookingAtCW) {
      const cWPosition = new THREE.Vector3(-1.1, 2.7, -2.7); // Adjust these values based on the exact position
      controls.current.target.copy(cWPosition);
      controls.current.object.lookAt(cWPosition);
    } else if (isLookingAtMagazine) {
      const magazinePosition = new THREE.Vector3(-.63, 0.3, 0.27);
      controls.current.target.copy(magazinePosition);
      controls.current.object.lookAt(magazinePosition);
    } else if (isEnvBuilt) {
      setTimeout(() => {
        controls.current.target.set(0, 1, 0);
      }, '150');
    }
  }
});

useEffect(() => {
  if (controls.current) {
    controls.current.enabled = !(isCameraMoving || isLookingAtComputer || isLookingAtCW || isLookingAtMagazine || !isEnvBuilt);
  }
}, [isCameraMoving, isLookingAtComputer, isLookingAtCW, isLookingAtMagazine]);

  return (
    <CameraControlContext.Provider value={{ zoomOut: handleAppleIconClick, runEnvBuild: handleEnvBuild }}>
    <OrbitControls
        ref={controls}
        enabled={!isCameraMoving || !isEnvBuilt}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.3} // Limit vertical rotation to 90 degrees
        minPolarAngle={0} // Limit vertical rotation to 0 degrees
        maxAzimuthAngle={Math.PI / 1.8} // Limit horizontal rotation to 90 degrees
        minAzimuthAngle={-Math.PI / 9} // Limit horizontal rotation to -90 degrees
        camera={camera}
      />
    <group ref={groupRef} {...props} dispose={null}>
    <Selection>
      { !isEnvBuilt || (isLookingAtComputer || hoverCW || hoverMagazine) ? <></> :
      <>
      <EffectComposer enabled={hover} autoClear={false}>
          <Outline
            edgeStrength={isEnvBuilt ? 3 : 25} // the edge strength
            visibleEdgeColor={isEnvBuilt ? 0xffffff : 0x555555} // the color of visible edges
          />
        </EffectComposer>
        </>
        }
        <Select enabled>
          <group onClick={handleComputerClick} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <group position={[0.581, 1.265, -1.136]}>
          <mesh name="Computer" geometry={nodes.Computer.geometry} material={textureMaterial}  />
          <ComputerScreen isLookingAtComputer={isLookingAtComputer} style={{ pointerEvents: 'auto' }}/>
          </group>
        <mesh name="Top_Housing" geometry={nodes.Top_Housing.geometry} material={textureMaterial} position={[0.515, 1.299, -0.831]} rotation={[0, 0.052, 0]}>
          <mesh name="клавиатура001" geometry={nodes.клавиатура001.geometry} material={textureMaterial} position={[0.04, 0.003, 0.053]} rotation={[1.628, 0, -2.527]} />
        </mesh>
        <group name="Apple_M0100_Mouse_-_Upper_Shell" position={[0.88, 1.246, -0.911]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh name="Apple_M0100_Mouse_-_Upper_Shell_1" geometry={nodes['Apple_M0100_Mouse_-_Upper_Shell_1'].geometry} material={textureMaterial} />
          <mesh name="Apple_M0100_Mouse_-_Upper_Shell_2" geometry={nodes['Apple_M0100_Mouse_-_Upper_Shell_2'].geometry} material={textureMaterial} />
        </group>
        <mesh name="Computer001" geometry={nodes.Computer001.geometry} material={textureMaterial} position={[0.629, 1.265, -1.136]} />
      </group>
      </Select>
      </Selection>
      { showGroup4 && ( 
      <>
        <group name="Walls" position={[0, 2, 0]}>
        <mesh name="Cube_1" geometry={nodes.Cube_1.geometry} material={textureMaterial} />
        <mesh name="Cube_2" geometry={nodes.Cube_2.geometry} material={textureMaterial} />
      </group>
      <mesh name="Floor_Frame" geometry={nodes.Floor_Frame.geometry} material={textureMaterial} position={[0, 2.027, 0]} />
      <group name="Rug" position={[0.744, 0.264, 0.575]} rotation={[0, -1.571, 0]}>
        <mesh name="Cube040" geometry={nodes.Cube040.geometry} material={textureMaterial} />
        <mesh name="Cube040_1" geometry={nodes.Cube040_1.geometry} material={textureMaterial} />
      </group>
      <group name="Floor" position={[0.113, 0.24, 0.151]} scale={1.005}>
        <mesh name="Cube039" geometry={nodes.Cube039.geometry} material={textureMaterial} />
        <mesh name="Cube039_1" geometry={nodes.Cube039_1.geometry} material={textureMaterial} />
      </group>
      <mesh name="Window_Frame" geometry={nodes.Window_Frame.geometry} material={textureMaterial} position={[0.96, 2.534, -1.887]} />
      <group name="Lower_Window" position={[0.96, 1.634, -2.031]}>
        <mesh name="Cube013_1" geometry={nodes.Cube013_1.geometry} material={textureMaterial} />
        <mesh name="Cube013_2" geometry={nodes.Cube013_2.geometry} material={textureMaterial} />
      </group>
      <mesh name="Blinds" geometry={nodes.Blinds.geometry} material={textureMaterial} position={[0.96, 2.534, -1.783]} />
      <mesh name="Cylinder" geometry={nodes.Cylinder.geometry} material={textureMaterial} position={[0.96, 2.278, -1.783]} rotation={[0, 0, -Math.PI / 2]} />
      <mesh name="Cylinder001" geometry={nodes.Cylinder001.geometry} material={textureMaterial} position={[0.96, 3.408, -1.783]} rotation={[0, 0, -Math.PI / 2]} />
      <mesh name="Seat" geometry={nodes.Seat.geometry} material={textureMaterial} position={[0.549, 1.05, -0.404]} rotation={[0, -0.33, 0]}>
        <mesh name="Circle" geometry={nodes.Circle.geometry} material={textureMaterial} position={[0, -0.602, -0.135]} />
        <mesh name="Cylinder006" geometry={nodes.Cylinder006.geometry} material={textureMaterial} position={[-0.001, -0.41, -0.136]} />
        <mesh name="Cylinder007" geometry={nodes.Cylinder007.geometry} material={textureMaterial} position={[0.331, -0.738, -0.135]} rotation={[Math.PI / 2, 0, 2.267]} />
        <mesh name="Cylinder008" geometry={nodes.Cylinder008.geometry} material={textureMaterial} position={[0.166, -0.738, 0.155]} rotation={[Math.PI / 2, 0, 1.919]} />
        <mesh name="Cylinder009" geometry={nodes.Cylinder009.geometry} material={textureMaterial} position={[-0.167, -0.738, 0.155]} rotation={[Math.PI / 2, 0, 2.042]} />
        <mesh name="Cylinder010" geometry={nodes.Cylinder010.geometry} material={textureMaterial} position={[-0.334, -0.738, -0.135]} rotation={[Math.PI / 2, 0, 1.896]} />
        <mesh name="Cylinder011" geometry={nodes.Cylinder011.geometry} material={textureMaterial} position={[-0.167, -0.738, -0.423]} rotation={[Math.PI / 2, 0, 2.545]} />
        <mesh name="Cylinder012" geometry={nodes.Cylinder012.geometry} material={textureMaterial} position={[0.166, -0.738, -0.425]} rotation={[Math.PI / 2, 0, 1.898]} />
      </mesh>
        </>
        )}
        { showGroup3 && ( 
          <>
        <mesh name="Table_Top" geometry={nodes.Table_Top.geometry} material={textureMaterial} position={[0.957, 1.199, -1.192]}>
        <mesh name="Cylinder002" geometry={nodes.Cylinder002.geometry} material={textureMaterial} position={[0.615, -0.116, 0.546]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh name="Cylinder003" geometry={nodes.Cylinder003.geometry} material={textureMaterial} position={[0.615, -0.353, 0.546]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh name="Cylinder004" geometry={nodes.Cylinder004.geometry} material={textureMaterial} position={[0.615, -0.596, 0.546]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh name="Cylinder005" geometry={nodes.Cylinder005.geometry} material={textureMaterial} position={[0.615, -0.836, 0.546]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh name="Drawers" geometry={nodes.Drawers.geometry} material={textureMaterial} position={[0.61, 0.004, 0]} />
        <mesh name="Table_Top002" geometry={nodes.Table_Top002.geometry} material={textureMaterial} position={[-0.897, 0, 0.461]} />
      </mesh>
      <mesh name="Table_Top001" geometry={nodes.Table_Top001.geometry} material={textureMaterial} position={[-1.202, 1.943, -1.603]} />
      <mesh name="Table_Top003" geometry={nodes.Table_Top003.geometry} material={textureMaterial} position={[-0.531, 1.657, -1.603]} />
      <mesh name="Table_Top006" geometry={nodes.Table_Top006.geometry} material={textureMaterial} position={[-1.56, 2.468, 1.194]} rotation={[0, Math.PI / 2, 0]} />
      <mesh name="Sheets" geometry={nodes.Sheets.geometry} material={textureMaterial} position={[-0.887, 0.874, -0.188]}>
        <mesh name="Bed_Frame" geometry={nodes.Bed_Frame.geometry} material={textureMaterial} position={[0.759, -0.074, 0.926]} />
        <mesh name="Mattress" geometry={nodes.Mattress.geometry} material={textureMaterial} position={[0, 0.061, -0.251]} />
        <mesh name="Pillow" geometry={nodes.Pillow.geometry} material={textureMaterial} position={[0.014, 0.179, -1.178]} rotation={[0.338, 0.011, 0.028]} />
        <mesh name="Small_Pillow" geometry={nodes.Small_Pillow.geometry} material={textureMaterial} position={[-0.256, 0.225, -0.799]} rotation={[0.514, 0.466, -0.164]} />
      </mesh>
      
      </>
      )}
      { showGroup2 && ( 
        <>
      <mesh name="Cube" geometry={nodes.Cube.geometry} material={textureMaterial} position={[0.206, 1.279, -1.351]} rotation={[0, 1.254, 0]} />
      <mesh name="Cube002" geometry={nodes.Cube002.geometry} material={textureMaterial} position={[0.2, 1.329, -1.362]} rotation={[0, 0.156, 0]} />
      <mesh name="Cube003" geometry={nodes.Cube003.geometry} material={textureMaterial} position={[0.2, 1.358, -1.362]} rotation={[0, 0.03, 0]} />
      <mesh name="Cube004" geometry={nodes.Cube004.geometry} material={textureMaterial} position={[-0.528, 1.856, -1.63]} rotation={[-Math.PI, 0, -1.748]} />
      <mesh name="Cube005" geometry={nodes.Cube005.geometry} material={textureMaterial} position={[-0.613, 1.868, -1.608]} rotation={[-Math.PI, 0, -Math.PI / 2]} />
      <mesh name="Cube006" geometry={nodes.Cube006.geometry} material={textureMaterial} position={[-0.688, 1.842, -1.6]} rotation={[-Math.PI, 0, -Math.PI / 2]} />
      <mesh name="Cube007" geometry={nodes.Cube007.geometry} material={textureMaterial} position={[-0.386, 1.732, -1.531]} rotation={[Math.PI, -0.156, Math.PI]} />
      <mesh name="Cube008" geometry={nodes.Cube008.geometry} material={textureMaterial} position={[-1.61, 2.684, 1.596]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} />
      <mesh name="Cube009" geometry={nodes.Cube009.geometry} material={textureMaterial} position={[-1.61, 2.694, 1.52]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} />
      <mesh name="Cube010" geometry={nodes.Cube010.geometry} material={textureMaterial} position={[-1.61, 2.689, 1.44]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} />
      <mesh name="Cube011" geometry={nodes.Cube011.geometry} material={textureMaterial} position={[-1.501, 2.526, 1.183]} rotation={[-Math.PI, 0.067, -Math.PI]} />
      <mesh name="Cube012" geometry={nodes.Cube012.geometry} material={textureMaterial} position={[-1.501, 2.573, 1.183]} rotation={[-Math.PI, 0.025, -Math.PI]} />
      <mesh name="Cube013" geometry={nodes.Cube013.geometry} material={textureMaterial} position={[-1.501, 2.612, 1.183]} rotation={[-Math.PI, 0.25, -Math.PI]} />
      <mesh name="Circle004" geometry={nodes.Circle004.geometry} material={textureMaterial} position={[0.387, 1.685, -1.771]}>
        <mesh name="Sphere004" geometry={nodes.Sphere004.geometry} material={textureMaterial} position={[0, 0.047, 0]} scale={[0.435, 0.344, 0.435]} />
        <mesh name="Sphere005" geometry={nodes.Sphere005.geometry} material={textureMaterial} position={[0.056, 0.051, 0]} rotation={[0, 0, -0.797]} scale={[0.182, 0.141, 0.209]} />
      </mesh>
      <mesh name="Circle005" geometry={nodes.Circle005.geometry} material={textureMaterial} position={[-1.581, 2.574, 0.804]} rotation={[0, -1.555, 0]}>
        <mesh name="Sphere006" geometry={nodes.Sphere006.geometry} material={textureMaterial} position={[0, 0.059, 0]} scale={[0.542, 0.428, 0.542]} />
        <mesh name="Sphere007" geometry={nodes.Sphere007.geometry} material={textureMaterial} position={[0.069, 0.064, 0]} rotation={[0, 0, -0.797]} scale={[0.226, 0.176, 0.26]} />
        <mesh name="Sphere008" geometry={nodes.Sphere008.geometry} material={textureMaterial} position={[-0.073, 0.111, -0.008]} rotation={[Math.PI, 0.108, 2.484]} scale={[0.299, 0.232, 0.343]} />
      </mesh>
      <mesh name="Circle006" geometry={nodes.Circle006.geometry} material={textureMaterial} position={[-1.292, 0.465, 1.632]} rotation={[0, -1.555, 0]} scale={1.418}>
        <mesh name="Plane" geometry={nodes.Plane.geometry} material={textureMaterial} position={[0.003, 0.052, -0.183]} rotation={[0, 1.555, -0.367]} scale={0.778} />
        <mesh name="Plane001" geometry={nodes.Plane001.geometry} material={textureMaterial} position={[0.152, 0.119, -0.034]} rotation={[-0.023, 0.238, -0.204]} scale={0.75} />
        <mesh name="Plane002" geometry={nodes.Plane002.geometry} material={textureMaterial} position={[-0.163, 0.134, -0.124]} rotation={[3.115, 0.68, 2.669]} scale={0.899} />
        <mesh name="Plane003" geometry={nodes.Plane003.geometry} material={textureMaterial} position={[-0.082, 0.091, 0.137]} rotation={[-3.064, -1.013, 2.908]} scale={0.928} />
        <mesh name="Plane004" geometry={nodes.Plane004.geometry} material={textureMaterial} position={[0.126, 0.065, 0.135]} rotation={[0, -1.128, -0.367]} scale={0.62} />
        <mesh name="Plane005" geometry={nodes.Plane005.geometry} material={textureMaterial} position={[0.011, 0.221, -0.136]} rotation={[-0.803, 1.539, 0.593]} scale={0.612} />
        <mesh name="Plane006" geometry={nodes.Plane006.geometry} material={textureMaterial} position={[-0.117, 0.233, 0.048]} rotation={[3.078, -0.671, 2.845]} scale={0.797} />
        <mesh name="Plane007" geometry={nodes.Plane007.geometry} material={textureMaterial} position={[0.111, 0.207, 0.033]} rotation={[-0.042, -0.232, -0.309]} scale={0.696} />
        <mesh name="Plane011_3" geometry={nodes.Plane011.geometry} material={textureMaterial} position={[0.072, 0.291, -0.071]} rotation={[-0.029, 0.681, -0.191]} scale={[0.548, 0.701, 0.54]} />
        <mesh name="Plane012" geometry={nodes.Plane012.geometry} material={textureMaterial} position={[-0.116, 0.291, -0.049]} rotation={[3.091, 0.195, 2.894]} scale={[0.719, 0.908, 0.703]} />
        <mesh name="Plane013" geometry={nodes.Plane013.geometry} material={textureMaterial} position={[0.015, 0.27, 0.093]} rotation={[-2.792, -1.451, -3.094]} scale={[0.672, 0.839, 0.653]} />
      </mesh>
      <group name="Cylinder019" position={[-0.191, 1.789, -1.596]}>
        <mesh name="Cylinder019_1" geometry={nodes.Cylinder019_1.geometry} material={textureMaterial} />
        <mesh name="Cylinder019_2" geometry={nodes.Cylinder019_2.geometry} material={textureMaterial} />
      </group>
      </>
      )}
      { showGroup1 && ( 
      <>
      <Selection>
        { !isLookingAtCW && !hover && !hoverMagazine && ( 
        <EffectComposer enabled={hoverCW} autoClear={false}>
            <Outline
              edgeStrength={3} // the edge strength
              visibleEdgeColor={0xffffff} // the color of visible edges
            />
        </EffectComposer>
      )}
      <Select enabled>
        <group onClick={handleCreatureWorldClick} onPointerEnter={() => setHoverCW(true)} onPointerLeave={() => setHoverCW(false)} >
          <group name="Creature" position={[-0.921, 2.162, -1.598]} rotation={[0, -1.264, 0]}>
            <mesh name="Cube509_Cube002" geometry={nodes.Cube509_Cube002.geometry} material={creatureMaterial} />
            <mesh name="Cube509_Cube002_1" geometry={nodes.Cube509_Cube002_1.geometry} material={creatureMaterial} />
            <mesh name="Cube509_Cube002_2" geometry={nodes.Cube509_Cube002_2.geometry} material={creatureMaterial} />
            <mesh name="Cube509_Cube002_3" geometry={nodes.Cube509_Cube002_3.geometry} material={creatureMaterial} />
            <mesh name="Creature_Ear" geometry={nodes.Creature_Ear.geometry} material={creatureMaterial} position={[-0.008, 0.118, 0.115]} rotation={[-3.09, 1.531, 3.084]} scale={[0.98, 1.0, 1.0]}/>
            <mesh name="Creature002" geometry={nodes.Creature002.geometry} material={creatureMaterial} position={[0, 0, -0.002]} />
          </group>
          <group name="Table_Top004" position={[-0.455, 2.794, -1.73]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh name="Cube022" geometry={nodes.Cube022.geometry} material={textureMaterial} />
            <mesh name="Cube022_1" geometry={nodes.Cube022_1.geometry} material={textureMaterial} />
          </group>
          <group name="Table_Top005" position={[-1.323, 2.543, -1.747]} rotation={[Math.PI / 2, 0, Math.PI]}>
            <mesh name="Cube023" geometry={nodes.Cube023.geometry} material={textureMaterial} />
            <mesh name="Cube023_1" geometry={nodes.Cube023_1.geometry} material={textureMaterial} />
          </group>
        </group>
      </Select>
        </Selection>
        {showCWText && (
          <>
          <animated.group position={[-0.7999, 3.556, -1.71]} // Adjust based on where you want the text
                          opacity={cWTextAnimation.opacity}>
            <Text color="#000000" font="/RobotoMonoBold.ttf" fontSize={0.06} maxWidth={1.75} lineHeight={0.99} letterSpacing={0.01} textAlign={'left'}anchorX="center" anchorY="middle" castShadow>
            At Creature World, I helped with the creation of "The Travelling Creature" which was the product of connecting art with ever evolving technology with the aim of bringing people together. Later, I explored new creative paths with the design team, blending digital art and innovative concepts.
            </Text>
          </animated.group>
          <animated.group position={[-0.8, 3.56, -1.7]} // Adjust based on where you want the text
                          opacity={cWTextAnimation.opacity}>
            <Text color="#ffffff" font="/RobotoMonoBold.ttf" fontSize={0.06} maxWidth={1.75} lineHeight={0.99} letterSpacing={0.01} textAlign={'left'}anchorX="center" anchorY="middle" castShadow>
            At Creature World, I helped with the creation of "The Travelling Creature" which was the product of connecting art with ever evolving technology with the aim of bringing people together. Later, I explored new creative paths with the design team, blending digital art and innovative concepts.
            </Text>
          </animated.group>
          </>
        )}
        { isEnvBuilt && (
        <>
      <Selection>
        { !isLookingAtMagazine && !hoverCW && !hover && ( 
          <>
          
        <EffectComposer enabled={hoverMagazine} autoClear={false}>
            <Outline
              edgeStrength={3} // the edge strength
              visibleEdgeColor={0xffffff} // the color of visible edges
            />
        </EffectComposer>
          
        </>
      )}
      <Select enabled>
        <group onClick={handleMagazineClick} onPointerEnter={() => setHoverMagazine(true)} onPointerLeave={() => setHoverMagazine(false)}>
        <group onClick={() => handlePageTurn(0)} name="Plane010" position={[-0.527, 0.959, 0.348]} rotation={[0, 0.873, 0.032]} >
          <mesh name="Plane024" geometry={nodes.Plane024.geometry} material={textureMaterial} />
          <mesh name="Plane024_1" geometry={nodes.Plane024_1.geometry} material={textureMaterial} />
        </group>
        <mesh onClick={() => handlePageTurn(1)} name="Plane014" geometry={nodes.Plane014.geometry} material={textureMaterial} position={[-0.527, 0.959, 0.348]} rotation={[0, 0.873, 0.024]}/>
        <mesh onClick={() => handlePageTurn(2)} name="Plane018" geometry={nodes.Plane018.geometry} material={textureMaterial} position={[-0.527, 0.959, 0.348]} rotation={[0, 0.873, 0.016]}/>
        <mesh onClick={() => handlePageTurn(3)} name="Plane022" geometry={nodes.Plane022.geometry} material={textureMaterial} position={[-0.527, 0.959, 0.348]} rotation={[0, 0.873, 0.008]}/>
        <mesh name="Plane023" geometry={nodes.Plane023.geometry} material={textureMaterial} position={[-0.527, 0.959, 0.348]} rotation={[0, 0.873, 0]}/>
        </group>
        </Select>
        </Selection> 
      <group name="Entertainment_System" position={[1.54, 1.246, -1.084]} rotation={[0, -0.386, 0]}>
        <mesh name="Plane011" geometry={nodes.Plane011_1.geometry} material={textureMaterial} />
        <mesh name="Plane011_1" geometry={nodes.Plane011_1.geometry} material={textureMaterial} />
        <mesh name="Plane011_2" geometry={nodes.Plane011_2.geometry} material={textureMaterial} />
        <mesh name="Circle007" geometry={nodes.Circle007.geometry} material={textureMaterial} position={[-0.112, 0.048, 0.345]} rotation={[0, -0.215, 0.004]} />
        <mesh name="Circle008" geometry={nodes.Circle008.geometry} material={textureMaterial} position={[-0.082, 0.048, 0.351]} rotation={[0, -0.215, 0.004]} />
        <mesh name="Circle009" geometry={nodes.Circle009.geometry} material={textureMaterial} position={[0.1, 0.038, 0.123]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh name="Circle012" geometry={nodes.Circle012.geometry} material={textureMaterial} position={[0.03, 0.206, 0.156]} rotation={[1.648, -0.201, 0.37]} />
        <mesh name="Circle013" geometry={nodes.Circle013.geometry} material={textureMaterial} position={[0.059, 0.206, 0.167]} rotation={[1.648, -0.201, 0.37]} />
        <mesh name="Circle014" geometry={nodes.Circle014.geometry} material={textureMaterial} position={[-0.156, 0.04, 0.14]} rotation={[1.82, -0.215, 0]} />
        <mesh name="Circle015" geometry={nodes.Circle015.geometry} material={textureMaterial} position={[-0.124, 0.04, 0.14]} rotation={[1.82, -0.215, 0]} />
        <mesh name="Cube015_1" geometry={nodes.Cube015.geometry} material={textureMaterial} position={[-0.185, 0.047, 0.328]} rotation={[0, -0.215, 0.004]} />
        <mesh name="Plane015" geometry={nodes.Plane015.geometry} material={textureMaterial} />
        <mesh name="Plane019" geometry={nodes.Plane019.geometry} material={textureMaterial} position={[-0.001, 0.176, -0.001]} rotation={[0, -0.358, 0]} />
        <mesh name="Plane020_2" geometry={nodes.Plane020.geometry} material={textureMaterial} position={[-0.045, 0.35, 0.117]} rotation={[0, -0.358, 0]} />
        <mesh name="Plane021" geometry={nodes.Plane021.geometry} material={textureMaterial} position={[-0.139, 0.004, 0.34]} rotation={[0, -0.215, 0.004]} />
        <mesh name="Vert" geometry={nodes.Vert.geometry} material={textureMaterial} position={[0.1, 0.038, 0.139]} />
        <mesh name="Plane021_1" geometry={nodes.Plane021_1.geometry} material={textureMaterial} />
        <mesh name="Plane021_2" geometry={nodes.Plane021_2.geometry} material={textureMaterial} />
        <mesh name="Plane009" geometry={nodes.Plane009.geometry} material={textureMaterial} scale={[1.1, 1.1, 1.2]} position={[0.002, -0.02, -0.032]}/>
        <mesh name="Plane009_1" geometry={nodes.Plane009_1.geometry} material={textureMaterial} />
      </group>
      <group name="Walls001" position={[-1.776, 2.562, -0.62]} scale={1.277}>
        <mesh name="Cube024" geometry={nodes.Cube024.geometry} material={textureMaterial} />
        <mesh name="Cube024_1" geometry={nodes.Cube024_1.geometry} material={textureMaterial} />
      </group>
      <mesh name="Circle001" geometry={nodes.Circle001.geometry} material={textureMaterial} position={[-0.764, 0.253, 1.314]} rotation={[0, -0.66, 0]}>
        <mesh name="Circle002" geometry={nodes.Circle002.geometry} material={textureMaterial} position={[0, 1.511, 0.26]} rotation={[-0.988, 0, 0]} />
        <mesh name="Cylinder013" geometry={nodes.Cylinder013.geometry} material={textureMaterial} position={[0.001, 1.689, -0.001]} rotation={[0, 0, -Math.PI / 2]} />
        <mesh name="Sphere" geometry={nodes.Sphere.geometry} material={textureMaterial} position={[0.001, 2.392, -1.05]} rotation={[0.249, 0.144, -0.699]} />
      </mesh>
      <mesh name="Circle003" geometry={nodes.Circle003.geometry} material={textureMaterial} position={[1.713, 1.248, -1.518]} rotation={[Math.PI, -0.09, Math.PI]}>
        <mesh name="Cylinder014" geometry={nodes.Cylinder014.geometry} material={textureMaterial} position={[-0.081, 0.204, 0]} rotation={[-Math.PI, 0, 2.644]} />
        <mesh name="Cylinder015" geometry={nodes.Cylinder015.geometry} material={textureMaterial} position={[-0.15, 0.328, 0.003]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} />
        <mesh name="Cylinder016" geometry={nodes.Cylinder016.geometry} material={textureMaterial} position={[-0.048, 0.423, 0.003]} rotation={[Math.PI, 0, -2.32]} />
        <mesh name="Cylinder017" geometry={nodes.Cylinder017.geometry} material={textureMaterial} position={[0.066, 0.527, 0.003]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} />
        <mesh name="Cylinder018" geometry={nodes.Cylinder018.geometry} material={textureMaterial} position={[0.112, 0.535, 0.003]} rotation={[-Math.PI, 0, -1.737]} />
        <mesh name="Sphere001" geometry={nodes.Sphere001.geometry} material={textureMaterial} position={[0, 0.058, 0]} />
        <mesh name="Sphere002" geometry={nodes.Sphere002.geometry} material={textureMaterial} position={[0.26, 0.484, 0.003]} rotation={[0, 0, 0.358]} />
        <mesh name="Sphere003" geometry={nodes.Sphere003.geometry} material={textureMaterial} position={[0.161, 0.541, 0.003]} rotation={[0, 0, 1.056]} />
      </mesh>
      </>
      )}
      </>
      )}
    </group>
    { !isEnvBuilt && (
      <RetroAnalogEffectComponent/>
    )}
    </CameraControlContext.Provider>
  )
}

useGLTF.preload('models/scene.glb')