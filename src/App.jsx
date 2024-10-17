import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import Startup from "./components/Startup";
import RotateOverlay from "./components/RotateOverlay";

function Loader({ setIsLoading }) {
  const { active, progress } = useProgress();

  useEffect(() => {
    setIsLoading(active);
  }, [active]);

  return null; 
}

function App() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isLoading, setIsLoading] = useState(true);

  const updateOrientation = () => {
    const isPortraitMode = window.innerHeight > window.innerWidth;
    setIsPortrait(isPortraitMode);
  };


  useEffect(() => {
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return (
    <>
      {isLoading && <Startup />}
      <Loader setIsLoading={setIsLoading} />
      <div style={{ visibility: isLoading ? 'hidden' : 'visible', height: '100vh' }}>
        {isPortrait && <RotateOverlay />}
        <Canvas>
          <Experience/>
        </Canvas>
      </div>
    </>
  );
}

export default App;
