import * as React from 'react';
const SvgTotalScore = (props: any) => (
  <svg
    width={157}
    height={145}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={'totalScore'}
  >
    <path
      d="M73.926 16.368a12 12 0 0 1 10.148 0l51.22 23.9a12 12 0 0 1 6.926 10.875v43.714c0 4.663-2.701 8.903-6.926 10.875l-51.22 23.9a11.999 11.999 0 0 1-10.148 0l-51.22-23.9a12 12 0 0 1-6.926-10.875V51.143a12 12 0 0 1 6.926-10.875l51.22-23.9Z"
      fill="url(#TotalScore_svg__a)"
    />
    <path
      d="m83.44 17.727 51.22 23.9a10.5 10.5 0 0 1 6.06 9.516v43.714a10.5 10.5 0 0 1-6.06 9.515l-51.22 23.901a10.502 10.502 0 0 1-8.88 0l-51.22-23.901a10.5 10.5 0 0 1-6.06-9.515V51.143a10.5 10.5 0 0 1 6.06-9.515l51.22-23.9a10.5 10.5 0 0 1 8.88 0Z"
      stroke="#fff"
      strokeOpacity={0.7}
      strokeWidth={3}
    />
    <defs>
      <radialGradient
        id="TotalScore_svg__a"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(0 59 -73 0 79 73)"
      >
        <stop offset={0} stopColor="#32012A" />
        <stop
          offset={1}
          stopColor={props.gradientColor}
        />
      </radialGradient>
    </defs>
  </svg>
);
export default SvgTotalScore;
