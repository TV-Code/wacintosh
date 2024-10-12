import { useDroppable } from "@dnd-kit/core";

const DroppableArea = ({ id, children, style, isOver, zIndex }) => {
    const { setNodeRef } = useDroppable({
      id,
      data: {
        zIndex,
      },
    });
  
    const droppableStyle = {
      ...style,
      position: "absolute",
      zIndex,
      filter: isOver ? "invert(100%)" : "none",
      pointerEvents: "auto",
    };
  
    return (
      <div ref={setNodeRef} style={droppableStyle}>
        {children}
      </div>
    );
  };

  export default DroppableArea;