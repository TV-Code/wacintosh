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
  previewOnly = false,
  hidePreview = false,
  isOpen = false,
}) => {
  const isDroppable = type === 'folder' || type === 'trash';

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging: isIconDragging,
  } = useDraggable({
    id,
    data: { type: 'icon', zIndex: zIndex, parentId },
  });

  const { setNodeRef: setDroppableRef, isOver: isOverSelf } = useDroppable({
    id,
    disabled: !isDroppable,
    data: { type: "folder", id, zIndex: zIndex }
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
    if (textRef.current) {
      setTextDimensions({
        width: textRef.current.offsetWidth,
        height: textRef.current.offsetHeight,
      });
    }
  }, [name]);

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
    filter: selected || (isOver && !isIconDragging) ? 'invert(100%)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    zIndex: zIndex,
    opacity: previewOnly ? 0 : isIconDragging ? 0 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const staticStyle = {
    ...style,
    opacity: isIconDragging ? 1 : 0,
    pointerEvents: 'none',
    zIndex: 1,
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
    display: hidePreview || !isIconDragging ? 'none' : 'block',
    zIndex: 110000,
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

  const iconContent = (
    <>
      {type === 'folder' && isOpen ? <OpenFolderIcon /> : children}
      <span ref={textRef} style={textStyle}>
        {name}
      </span>
    </>
  );

  return (
    <>
      <div
        ref={combinedRef}
        style={{
          ...style,
          opacity: previewOnly ? 0 : isIconDragging ? 0 : 1,
        }}
        {...listeners}
        {...attributes}
        onDoubleClick={onDoubleClick}
        onClick={onClick}
        className={`${className} ${selected ? 'selected' : ''}`}
      >
        {iconContent}
      </div>
      {isIconDragging && !previewOnly && (
        <div style={staticStyle} className={`${className} ${selected ? 'selected' : ''}`}>
          {iconContent}
        </div>
      )}
      <svg
        style={{
          ...svgStyle,
          opacity: isIconDragging ? 1 : 0,
        }}
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
    </>
  );
};

export default DraggableIcon;