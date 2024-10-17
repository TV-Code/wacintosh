
import { rectIntersection } from "@dnd-kit/core";

const customCollisionDetection = (args) => {
  const { active, droppableContainers, pointerCoordinates } = args;

  if (!active || !droppableContainers || !pointerCoordinates) {
    return [];
  }

  const intersections = rectIntersection(args);

  if (!intersections || intersections.length === 0) {
    return [];
  }

  const intersectingDroppables = intersections
    .map((intersection) => {
      const droppable = droppableContainers.find((d) => d.id === intersection.id);
      if (droppable) {
        return {
          id: droppable.id,
          zIndex: droppable.data.current.zIndex || 0,
        };
      }
      return null;
    })
    .filter(Boolean);


  if (intersectingDroppables.length === 0) {
    return [];
  }

  intersectingDroppables.sort((a, b) => b.zIndex - a.zIndex);

  return [intersectingDroppables[0]];
};

export default customCollisionDetection;
