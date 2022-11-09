import ExternalForce from '../shader/externalForce.frag';
import {Effect} from 'postprocessing';
import {Uniform, Vector2} from 'three';

export class ExternalForceEffect extends Effect {
  constructor(velocity, force, fboSize, mousePos) {
    super('ExternalForceEffect', ExternalForce, {
      uniforms: new Map([
        ['velocity', new Uniform(velocity)],
        ['force', new Uniform(force)],
        ['fboSize', new Uniform(fboSize)],
        ['mousePos', new Uniform(mousePos ? mousePos: new Vector2(0, 0))],
      ]),
    });
  }

  // getFragments() {
  //   return this.fragments;
  // }
  //
  // setFragments(fragments) {
  //   fragments = Math.floor(fragments);
  //
  //   // const uniforms = this.uniforms;
  //   // uniforms.get('active').value = fragments > 0.0;
  //   uniforms.get('fragments').value = fragments;
  //
  //   this.fragments = fragments;
  // }
  //
  // setSize(width, height) {
  //   this.resolution.set(width, height);
  //   this.setFragments(this.fragments);
  // }

  setMousePos(pos) {
    this.uniforms.get('mousePos').value = pos;
  }
  setFboSize(fboS) {
    this.uniforms.get('fboSize').value = fboS;
  }
  setForce(force) {
    this.uniforms.get('force').value = force;
  }
}
