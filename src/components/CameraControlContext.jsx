import { createContext, useContext } from 'react';

const CameraControlContext = createContext();

export const useCameraControl = () => useContext(CameraControlContext);

export default CameraControlContext;