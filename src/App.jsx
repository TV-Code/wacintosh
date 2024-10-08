import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import Startup from "./components/Startup";
import RotateOverlay from "./components/RotateOverlay";

function Loader({ setIsLoading }) {
  const { active, progress } = useProgress();

  // Update isLoading based on active
  useEffect(() => {
    setIsLoading(active);
  }, [active]);

  // Optionally, use the progress for a loading bar or indicator
  console.log(`Loading progress: ${progress}%`);

  return null; // This component doesn't render anything itself
}

function App() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isLoading, setIsLoading] = useState(true);

  // Function to update orientation state
  const updateOrientation = () => {
    const isPortraitMode = window.innerHeight > window.innerWidth;
    setIsPortrait(isPortraitMode);
  };

  // useEffect to add event listeners for orientation changes
  useEffect(() => {
    // Listen for window resize and orientation change events
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Cleanup event listeners when component unmounts
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
