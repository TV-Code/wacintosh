import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import OpenFolderIcon from '../assets/OpenFolderIcon.svg?react';

const DraggableIcon = ({
  id,
  position,
  children,
  onDoubleClick,
  onClick,
  className,
  selected,
  isOver,
  parentId = null,
  type,
  zIndex,
  name,
  windowPosition,
  previewOnly = false,
  hidePreview = false,
  items,
  isOpen = false,
}) => {
  const isDroppable = type === 'folder' || type === 'trash';

  const [lastTap, setLastTap] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id,
    data: { type: 'icon', zIndex: zIndex, parentId },
  });

  const { setNodeRef: setDroppableRef, isOver: isOverSelf } = useDroppable({
    id,
    disabled: !isDroppable,
  });

  const textRef = useRef(null);
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  const combinedRef = useCallback(
    (node) => {
      setDraggableRef(node);
      if (isDroppable) {
        setDroppableRef(node);
      }
    },
    [setDraggableRef, setDroppableRef, isDroppable]
  );

  useEffect(() => {
    console.log(`Icon ${id} has parentId:`, parentId);
  }, [id, parentId]);

  useEffect(() => {
    if (textRef.current) {
      setTextDimensions({
        width: textRef.current.offsetWidth,
        height: textRef.current.offsetHeight,
      });
    }
  }, [name]);

  

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    setTouchStartTime(Date.now());
    setTouchStartPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (event) => {
    const touchEndTime = Date.now();
    const touch = event.changedTouches[0];
    const touchEndPosition = { x: touch.clientX, y: touch.clientY };

    const timeDiff = touchEndTime - touchStartTime;
    const distance = Math.sqrt(
      Math.pow(touchEndPosition.x - touchStartPosition.x, 2) +
      Math.pow(touchEndPosition.y - touchStartPosition.y, 2)
    );

    if (timeDiff < 200 && distance < 10) {
      // This is considered a tap
      onClick(event);
    }
  };

  const getTextTopPosition = () => {
    switch (type) {
      case 'folder':
        return '-8px';
      case 'trash':
        return '-5px';
      case 'environment':
        return '2px';
      default:
        return '-1px';
    }
  };

  const style = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: 'pointer',
    filter: selected || (isOver && !isDragging) ? 'invert(100%)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    zIndex: isDragging ? 9999 : zIndex,
    opacity: previewOnly ? 0 : isDragging ? 0 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const staticStyle = {
    ...style,
    opacity: isDragging ? 1 : 0,
    pointerEvents: 'none',
    transform: undefined,
  };

  const textStyle = {
    position: 'relative',
    top: getTextTopPosition(),
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const iconSize = 64;
  const iconMargin = 8;
  const strokeWidth = 2.5;

  const textWidth = Math.max(iconSize, textDimensions.width);
  const iconLeftOffset = (textWidth - iconSize) / 2;

  const svgStyle = {
    position: 'absolute',
    left: `${position.x + iconMargin - strokeWidth / 2}px`,
    top: `${position.y + iconMargin + 1 - strokeWidth / 2}px`,
    pointerEvents: 'none',
    display: hidePreview || !isDragging ? 'none' : 'block',
    zIndex: 10000,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const pathData = `
    M ${iconLeftOffset + strokeWidth / 2},${strokeWidth / 2}
    h ${iconSize - strokeWidth}
    v ${iconSize - strokeWidth}
    h ${(textWidth - iconSize) / 2}
    v ${textDimensions.height}
    h -${textWidth - strokeWidth}
    v -${textDimensions.height}
    h ${(textWidth - iconSize) / 2}
    v -${iconSize - strokeWidth}
    Z
  `;

  return (
    <>
      <div
        ref={combinedRef}
        style={style}
        {...listeners}
        {...attributes}
        onDoubleClick={onDoubleClick}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`${className} ${selected ? 'selected' : ''}`}
      >
        {type === 'folder' && isOpen ? <OpenFolderIcon /> : children}
        <span ref={textRef} style={textStyle}>
          {name}
        </span>
      </div>
      <div style={staticStyle} className={`${className} ${selected ? 'selected' : ''}`}>
      {type === 'folder' && isOpen ? <OpenFolderIcon /> : children}
        <span style={textStyle}>{name}</span>
      </div>
      {!hidePreview && (
        <svg
          style={svgStyle}
          width={textWidth}
          height={iconSize + textDimensions.height}
        >
          <path
            d={pathData}
            fill="none"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap='square'
          />
        </svg>
      )}
    </>
  );
};

export default DraggableIcon;