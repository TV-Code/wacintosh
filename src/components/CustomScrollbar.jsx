import React from 'react';
import upArrowIcon from '../assets/scrollbar-up.svg';
import downArrowIcon from '../assets/scrollbar-down.svg';
import leftArrowIcon from '../assets/scrollbar-left.svg';
import rightArrowIcon from '../assets/scrollbar-right.svg';

const CustomScrollbar = ({ orientation = 'horizontal', isTrash }) => {
  const isVertical = orientation === 'vertical';

  const containerStyle = {
    position: 'absolute',
    ...(isVertical
      ? { 
          right: 0, 
          top: isTrash ? '69px' : '34px', 
          width: '28px', 
          height: isTrash ? 'calc(100% - 98px)' : 'calc(100% - 63px)',
          borderLeft: '1px solid black',
          borderTop: '1px solid black',
        }
      : { 
          bottom: 0, 
          left: 0, 
          height: '27px', 
          width: 'calc(100% - 29px)',
          borderTop: '1px solid black'
        }),
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    justifyContent: 'space-between',
    zIndex: '1500',
    overflow: 'hidden',
  };

  const arrowStyle = {
    width: '28px',
    height: '28px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    border: 'none',
    backgroundSize: '32px 32px', // Slightly smaller than the container
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const upArrowStyle = {
    ...arrowStyle,
    backgroundImage: `url(${upArrowIcon})`,
  };

  const downArrowStyle = {
    ...arrowStyle,
    backgroundImage: `url(${downArrowIcon})`,
  };

  const leftArrowStyle = {
    ...arrowStyle,
    backgroundImage: `url(${leftArrowIcon})`,
  };

  const rightArrowStyle = {
    ...arrowStyle,
    backgroundImage: `url(${rightArrowIcon})`,
  };

  return (
    <div style={containerStyle}>
      <div style={isVertical ? upArrowStyle : leftArrowStyle} />
      <div style={isVertical ? downArrowStyle : rightArrowStyle} />
    </div>
  );
};

export default CustomScrollbar;