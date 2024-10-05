import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import Startup from "./components/Startup";

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
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <Startup />}
      <Loader setIsLoading={setIsLoading} />
      <div style={{ visibility: isLoading ? 'hidden' : 'visible', height: '100vh' }}>
        <Canvas>
          <Experience/>
        </Canvas>
      </div>
    </>
  );
}

export default App;
