import {Vector3} from 'three';

export function hex2rgb( hex: string ) {
  if ( hex.slice(0, 1) == '#' ) hex = hex.slice(1);
  if ( hex.length == 3 ) {
    hex = hex.slice(0, 1) + hex.slice(0, 1) +
            hex.slice(1, 2) + hex.slice(1, 2) +
            hex.slice(2, 3) + hex.slice(2, 3);
  }
  return [hex.slice( 0, 2 ), hex.slice( 2, 4 ),
    hex.slice( 4, 6 )].map( function( str ) {
    return parseInt( str, 16 );
  } );
}

function colorToHex(color: number) {
  const intColor = Math.floor(color);
  const hexadecimal = intColor.toString(16);
  return hexadecimal.length == 1 ? '0' + hexadecimal : hexadecimal;
}

export function rgb2hex(rgb: number[]) {
  return '#' + colorToHex(rgb[0]) + colorToHex(rgb[1]) + colorToHex(rgb[2]);
}

export function mix(a: number[], b:number[], x: number) {
  const result : number[] = [];
  a.forEach((value, index) => {
    result.push(value * x + b[index] * (1-x));
  });
  return result;
}

export const translateGeoCoords =
    (latitude: number, longitude: number, radius: number) => {
      // 仰角
      const phi = latitude * Math.PI / 180;
      // 方位角
      const theta = (longitude - 180) * Math.PI / 180;

      const x = -1 * radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta);

      return new Vector3(x, y, z);
    };
