import * as React from 'react';
import {useRef} from 'react';

const InfoButton = (props:any) => {
  const scaleRef = useRef<SVGAElement>(null);
  return (
    <svg
      width={'88px'}
      height={'88px'}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform={`scale(0.15)`} ref={scaleRef} className={'scale'}>
        <path
          d="M168 0a168.001 168.001 0 1 0 168 168A168.193 168.193 0 0 0 168 0ZM24 168A143.521 143.521 0 0 1 72 60.972V84a24.002 24.002 0 0 0 24 24h40.584a24.002 24.002 0 0 0 21.48-13.272L163.404 84H192v48h-57.18a23.995 23.995 0 0 0-10.716 2.52L85.26 153.96A23.995 23.995 0 0 0 72 175.404v44.46a24.001 24.001 0 0 0 15.084 22.284l46.188 18.48 8.136 48.792A144.172 144.172 0 0 1 24 168Zm142.152 143.904-11.424-68.544L96 219.876v-44.46L134.832 156H216V60h-67.416l-12 24H96V43.476A143.495 143.495 0 0 1 303.6 120H240v48l11.064 45.756L228 248.376v50.364A142.898 142.898 0 0 1 168 312c-.624 0-1.224-.084-1.848-.096ZM252 284.724v-29.088l19.032-28.56a24.048 24.048 0 0 0 3.324-19.14L264 166.524V144h45.84A142.084 142.084 0 0 1 252 284.724Z"
          fill="#FFFFFF"
          filter='url(#b)'
          className={'fill'}
        />
        <circle cx="168" cy="167" r="147" fill="#FFFFFF" fillOpacity="0.5" stroke="url(#d)" strokeWidth={'30px'} className={'circle'}/>
        <path
          d="M160.21 245V135.909h25.71V245h-25.71Zm12.926-124.574c-4.072 0-7.575-1.349-10.511-4.048-2.936-2.746-4.403-6.037-4.403-9.872 0-3.883 1.467-7.174 4.403-9.873 2.936-2.746 6.439-4.119 10.511-4.119 4.12 0 7.623 1.373 10.512 4.12 2.935 2.698 4.403 5.989 4.403 9.872 0 3.835-1.468 7.126-4.403 9.872-2.889 2.699-6.392 4.048-10.512 4.048Z"
          fill="url(#d)"
          className={'text'}
        />
      </g>
      <defs>
        <linearGradient
          id="a"
          x1={271}
          y1={43.5}
          x2={48}
          y2={289}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0FF" />
          <stop offset={1} stopColor="#FF00D6" />
        </linearGradient>
        <linearGradient
          id="d"
          x1={115.5}
          y1={219.5}
          x2={216}
          y2={78}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF00D6" />
          <stop offset={1} stopColor="#03D2FF" />
        </linearGradient>
        <radialGradient
          id="c"
          cx={0}
          cy={0}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(0 147 -147 0 168 167)"
        >
          <stop stopColor="#000588" />
          <stop offset={1} stopColor="#FF00D6" stopOpacity={0.55} />
        </radialGradient>
        <filter
          id="b"
        >
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
    </svg>
  );
};

export default InfoButton;
