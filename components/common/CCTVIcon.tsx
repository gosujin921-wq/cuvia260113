
import React from 'react';

interface CCTVIconProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}

const CCTVIcon: React.FC<CCTVIconProps> = ({ className, style, width = '16px', height = '16px' }) => {
  return (
    <svg 
      id="Layer_1"
      width={width} 
      height={height} 
      viewBox="0 0 16 16" 
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
      className={className}
      style={style}
    >
      <defs>
        <style>
          {`.st0, .st1 {
            fill: none;
          }
          .st1 {
            stroke: currentColor;
            stroke-width: 1.72px;
          }
          .st2 {
            clip-path: url(#clippath);
          }`}
        </style>
        <clipPath id="clippath">
          <rect className="st0" y="1.5" width="16" height="13"/>
        </clipPath>
      </defs>
      <g className="st2">
        <g>
          <g shapeRendering="crispEdges">
            <polygon points="4.66 5.57 6.09 2.04 14.57 5.46 12.33 8.56 4.66 5.57" fill="currentColor"/>
            <path d="M6.41,2.79l7.27,2.94-1.55,2.14-6.71-2.62.99-2.46M5.77,1.29l-1.86,4.6,8.62,3.37,2.93-4.05h.01L5.77,1.29h0Z" fill="currentColor"/>
          </g>
          <g shapeRendering="crispEdges">
            <polygon points="13.54 7.99 14.35 6.86 14.91 7.12 14.42 8.34 13.54 7.99" fill="currentColor"/>
            <polygon points="14.16 6.14 12.65 8.25 14.74 9.08 15.66 6.82 15.65 6.83 14.16 6.14 14.16 6.14" fill="currentColor"/>
          </g>
          <g shapeRendering="crispEdges">
            <rect x=".57" y="9.66" width=".98" height="4.26" fill="currentColor"/>
            <polygon points="2.13 9.08 0 9.08 0 14.5 2.13 14.5 2.13 9.08 2.13 9.08" fill="currentColor"/>
          </g>
          <path className="st1" d="M8.17,7.42l-1.59,4.38H2.13"/>
        </g>
      </g>
    </svg>
  );
};

export default CCTVIcon;
