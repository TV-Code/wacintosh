// CustomCollisionDetection.jsx
import { rectIntersection } from "@dnd-kit/core";

/**
 * Custom collision detection function that prioritizes droppables based on their zIndex.
 * @param {Object} args - The collision detection context provided by @dnd-kit/core.
 * @returns {Array<string>} - An array containing the ID of the topmost droppable area.
 */
const customCollisionDetection = (args) => {
  const { active, droppableContainers, pointerCoordinates } = args;

  // Ensure necessary properties are defined
  if (!active || !droppableContainers || !pointerCoordinates) {
    return [];
  }

  // Get all intersections using rectIntersection
  const intersections = rectIntersection(args);

  if (!intersections || intersections.length === 0) {
    return [];
  }

  // Map intersecting IDs to their droppable objects with zIndex
  const intersectingDroppables = intersections
    .map((intersection) => {
      const droppable = droppableContainers.find((d) => d.id === intersection.id);
      if (droppable) {
        return {
          id: droppable.id,
          zIndex: droppable.data.current.zIndex || 0, // Default to 0 if zIndex is undefined
        };
      }
      return null;
    })
    .filter(Boolean); // Remove any null values


  if (intersectingDroppables.length === 0) {
    return [];
  }

  // Sort the intersecting droppables by zIndex in descending order
  intersectingDroppables.sort((a, b) => b.zIndex - a.zIndex);

  // Return the ID of the topmost droppable area
  return [intersectingDroppables[0]];
};

export default customCollisionDetection;
