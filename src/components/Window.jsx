import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import CustomScrollbar from "./CustomScrollbar";

const WINDOW_MARGIN = 16;

const ResizePreview = ({ size, position, zIndex }) => {
  const VERTICAL_SCROLLBAR_WIDTH = 29;
  const HORIZONTAL_SCROLLBAR_HEIGHT = 28;
  const HEADER_HEIGHT = 33;

  const outerStyle = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    margin: `${WINDOW_MARGIN}px`,
    border: "2px dotted black",
    pointerEvents: "none",
    zIndex: zIndex + 1,
  };

  const headerStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: `${HEADER_HEIGHT}px`,
    borderBottom: "2px dotted black",
  };

  const verticalScrollbarStyle = {
    position: "absolute",
    right: 0,
    top: "35px",
    width: `${VERTICAL_SCROLLBAR_WIDTH}px`,
    height: `calc(100% - ${HEADER_HEIGHT}px)`,
    borderLeft: "2px dotted black",
  };

  const horizontalScrollbarStyle = {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "100%",
    height: `${HORIZONTAL_SCROLLBAR_HEIGHT}px`,
    borderTop: "2px dotted black",
  };

  return (
    <div style={outerStyle}>
      <div style={headerStyle} />
      <div style={verticalScrollbarStyle} />
      <div style={horizontalScrollbarStyle} />
    </div>
  );
};

const Window = ({
  id,
  title,
  content,
  readMeStage,
  onClose,
  style,
  zIndex,
  itemCount,
  trashSize,
  onFocus,
  onResize,
  position,
  size: initialSize,
  onIconInteraction,
  selectedIcon,
  elementZIndexes,
  BASE_WINDOW_ICON_Z_INDEX,
  children,
  trashContents,
  updateTrashContents,
}) => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  const [windowSize, setWindowSize] = useState(
    initialSize || { width: 200, height: 200 }
  );
  const [isResizing, setIsResizing] = useState(false);
  const [previewSize, setPreviewSize] = useState(windowSize);

  const contentRef = useRef(null);
  const titleBarRef = useRef(null);
  const resizeButtonRef = useRef(null);
  const windowRef = useRef(null);

  const isReadme = id === "readme";
  const isTrash = title === "Trash";

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `window-${id}`,
    data: { type: "window", id, initialWindowPosition: position },
    handle: titleBarRef,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `window-${id}`,
    data: { type: "window", id, zIndex },
    disabled: isReadme,
  });

  useEffect(() => {
    console.log(content);
  }, [isDragging, isResizing]);

  const handleResize = useCallback(
    (e) => {
      e.preventDefault();
      onFocus(id);
      setIsResizing(true);
  
      const startX = e.clientX || e.touches[0].clientX;
      const startY = e.clientY || e.touches[0].clientY;
      const startWidth = windowSize.width;
      const startHeight = windowSize.height;
  
      const windowRect = windowRef.current.getBoundingClientRect();
      const scaleX = startWidth / windowRect.width;
      const scaleY = startHeight / windowRect.height;
  
      let currentPreviewSize = { ...windowSize };
  
      const handleMove = (moveEvent) => {
        const clientX = moveEvent.clientX || moveEvent.touches[0].clientX;
        const clientY = moveEvent.clientY || moveEvent.touches[0].clientY;
  
        const deltaX = (clientX - startX) * scaleX;
        const deltaY = (clientY - startY) * scaleY;
  
        const newWidth = Math.max(200, startWidth + deltaX);
        const newHeight = Math.max(200, startHeight + deltaY);
  
        currentPreviewSize = { width: newWidth, height: newHeight };
        setPreviewSize(currentPreviewSize);
      };
  
      const handleEnd = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchend", handleEnd);
        setIsResizing(false);
        setWindowSize(currentPreviewSize);
        onResize(id, currentPreviewSize);
      };
  
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
    },
    [id, onFocus, onResize, windowSize]
  );

  const windowStyle = {
    ...style,
    zIndex: zIndex,
    width: `${windowSize.width}px`,
    height: `${windowSize.height}px`,
    position: "absolute",
    border: "1px solid black",
    left: `${position.x}px`,
    top: `${position.y}px`,
    display: "flex",
    flexDirection: "column",
    margin: `${WINDOW_MARGIN}px`,
    opacity: isDragging ? "0" : "1",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  const staticStyle = {
    ...windowStyle,
    opacity: isDragging ? "1" : 0,
    transform: undefined,
  };

  const previewStyle = {
    ...windowStyle,
    position: "absolute",
    width: `${previewSize.width}px`,
    height: `${previewSize.height}px`,
    left: `${position.x}px`,
    top: `${position.y}px`,
    margin: `${WINDOW_MARGIN}px`,
    border: "2px dotted black",
    pointerEvents: "none",
    opacity: isDragging ? "1" : "0",
    zIndex: zIndex + 1,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  const resizeButtonStyle = {
    position: "absolute",
    right: isIOS ? "0" : "-1px",
    bottom: isIOS ? "0" : "-2px",
    width: isIOS ? "29px" : "30px",
    height: isIOS ? "28px" : "30px",
    borderTop: "1px solid #000",
    borderLeft: "1px solid black",
    background: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: '3500',
  };

  const resizeIconStyle = {
    width: "10px",
    height: "10px",
    position: "relative",
  };

  const smallSquareStyle = {
    position: "absolute",
    bottom: "1px",
    right: isIOS ? "0" : "2px",
    width: "8px",
    height: "8px",
    border: "2px solid #000",
    background: "#fff",
  };

  const largeSquareStyle = {
    position: "absolute",
    left: isIOS ? '-3px' : "0px",
    width: "12px",
    height: "12px",
    border: "2px solid #000",
    background: "#fff",
  };

  const windowContentStyle = {
    position: "relative",
    padding: "0",
    overflow: "visible",
  };

  const constrainedLayerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  };

  const unconstrainedLayerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    overflow: "visible",
    zIndex: 10000,
  };

  const renderContent = () => {
    if (id === "readme") {
      const trimmedContent = content[readMeStage].trimStart();
      return (
        <div style={{ height: 'calc(100% - 35px)', overflow: 'hidden'}}>
          <div
            style={{
              fontSize: "28px",
              padding: "10px",
              overflow: "hidden",
              paddingRight: "30px",
              whiteSpace: "pre-wrap",
              height: "auto",
            }}
          >
            {trimmedContent}
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div style={constrainedLayerStyle}>
            {React.Children.map(children, (child) =>
              React.cloneElement(child, {
                style: {
                  ...child.props.style,
                  position: "absolute",
                  left: `${child.props.position.x}px`,
                  top: `${child.props.position.y}px`,
                },
                windowSize: windowSize,
                windowPosition: position,
                previewOnly: false,
                onIconInteraction: onIconInteraction,
                selectedIcon: selectedIcon,
                elementZIndexes: elementZIndexes,
                BASE_WINDOW_ICON_Z_INDEX: BASE_WINDOW_ICON_Z_INDEX,
                onDragEnd: (event) => {
                  if (id === 'trash') {
                    const { active, over } = event;
                    if (over && over.id !== 'window-trash') {
                      updateTrashContents((prev) => prev.filter((item) => item.id !== active.id));
                    }
                  }
                },
              })
            )}
          </div>
          <div style={{
            ...unconstrainedLayerStyle,
            background: 'transparent',
            overflow: 'visible',
          }}>
            {React.Children.map(children, (child) =>
              React.cloneElement(child, {
                style: {
                  ...child.props.style,
                  position: "absolute",
                  left: `${child.props.position.x}px`,
                  top: `${child.props.position.y}px`,
                },
                windowSize: windowSize,
                windowPosition: position,
                previewOnly: true,
                onIconInteraction: onIconInteraction,
                selectedIcon: selectedIcon,
                elementZIndexes: elementZIndexes,
                BASE_WINDOW_ICON_Z_INDEX: BASE_WINDOW_ICON_Z_INDEX,
              })
            )}
          </div>
        </>
      );
    }
  };

  return (
    <>
      <div
        ref={(node) => {
          setDraggableRef(node);
          setDroppableRef(node);
          windowRef.current = node;
        }}
        data-window-id={id}
        style={windowStyle}
        className="window"
        onMouseDown={() => onFocus(id)}
      >
        <div
          ref={titleBarRef}
          className="title-bar"
          onMouseDown={() => onFocus(id)}
          {...attributes}
          {...listeners}
        >
          <div className="close-wrapper">
            <button
              aria-label="Close"
              className="close"
              onClick={onClose}
            ></button>
          </div>
          <h1 className="title">{title}</h1>
        </div>
        {title === "Trash" &&
          itemCount !== undefined &&
          trashSize !== undefined && (
            <>
              <div className="details-bar">
                <span>{itemCount} items</span>
                <span>{trashSize}K in Trash</span>
                <span style={{ color: "white" }}>lov</span>
              </div>
              <div
                style={{ borderTop: "0.15rem solid #fff" }}
                className="separator"
              ></div>
            </>
          )}
        <div className="separator"></div>
        <div
          className="window-pane"
          ref={setDroppableRef}
          style={windowContentStyle}
        >
          {renderContent()}
        </div>
        <CustomScrollbar
          orientation="vertical"
          contentRef={contentRef}
          isTrash={isTrash}
        />
        <CustomScrollbar orientation="horizontal" contentRef={contentRef} />
        <button
          ref={resizeButtonRef}
          className="resize-handle"
          style={resizeButtonStyle}
          onMouseDown={handleResize}
          onTouchStart={handleResize}
        >
          <div style={resizeIconStyle}>
            <div style={largeSquareStyle}></div>
            <div style={smallSquareStyle}></div>
          </div>
        </button>
      </div>
      {isDragging && (
        <>
          <div style={previewStyle} />
          <div className="window" style={staticStyle}>
            <div
              ref={titleBarRef}
              className="title-bar"
              onMouseDown={() => onFocus(id)}
              {...attributes}
              {...listeners}
            >
              <div className="close-wrapper">
                <button
                  aria-label="Close"
                  className="close"
                  onClick={onClose}
                ></button>
              </div>
              <h1 className="title">{title}</h1>
            </div>
            {title === "Trash" &&
              itemCount !== undefined &&
              trashSize !== undefined && (
                <>
                  <div className="details-bar">
                    <span>{itemCount} items</span>
                    <span>{trashSize}K in Trash</span>
                    <span style={{ color: "white" }}>lov</span>
                  </div>
                  <div
                    style={{ borderTop: "0.15rem solid #fff" }}
                    className="separator"
                  ></div>
                </>
              )}
            <div className="separator"></div>
            <div
              className="window-pane"
              ref={setDroppableRef}
              style={windowContentStyle}
            >
              {renderContent()}
            </div>
            <CustomScrollbar
              orientation="vertical"
              contentRef={contentRef}
              isTrash={isTrash}
            />
            <CustomScrollbar orientation="horizontal" contentRef={contentRef} />
            <button
              ref={resizeButtonRef}
              className="resize-handle"
              style={resizeButtonStyle}
              onMouseDown={handleResize}
            >
              <div style={resizeIconStyle}>
                <div style={largeSquareStyle}></div>
                <div style={smallSquareStyle}></div>
              </div>
            </button>
          </div>
        </>
      )}
      {isResizing && (
        <ResizePreview size={previewSize} position={position} zIndex={zIndex} />
      )}
    </>
  );
};

export default Window;
