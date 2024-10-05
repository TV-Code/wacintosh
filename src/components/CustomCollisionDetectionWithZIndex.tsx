import { rectIntersection } from '@dnd-kit/core';

const customCollisionDetectionWithWindowPriority = (args) => {
  const intersections = rectIntersection(args);

  if (!intersections.length) {
    return [];
  }

  const windowIntersection = intersections.find(
    intersection => typeof intersection.id === 'string' && intersection.id.startsWith('window-')
  );

  if (windowIntersection) {
    return [windowIntersection];
  }

  return [intersections[0]];
};

export default customCollisionDetectionWithWindowPriority;