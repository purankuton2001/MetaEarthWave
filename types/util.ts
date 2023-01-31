import {Vector3} from 'three';
import {ReactNode} from 'react';

export type EarthProps = {
    position: Vector3;
}
export type ParticleProps = {
    position: Vector3;
}
export type LayerProps = {
    layer: number,
    children: ReactNode,
}
