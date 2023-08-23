import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import System, {
  Emitter,
  Rate,
  Span,
  Position,
  Mass,
  Radius,
  Life,
  PointZone,
  Vector3D,
  Alpha,
  Scale,
  Color,
  Body,
  RadialVelocity,
  SpriteRenderer,
  // @ts-ignore
} from 'three-nebula';
import {
  AdditiveBlending,
  Euler,
  Sprite,
  SpriteMaterial,
  TextureLoader} from 'three';
import * as THREE from 'three';
import {useWebSocket} from '../context/WebSocket';
import {translateGeoCoords} from '../utils';


export function ParticleSystem() {
  const earthState = useWebSocket();
  useEffect(() => {
    const now = new Date();
    const limitTime = now.setMinutes(now.getMinutes() - 1);
    addWave(0, 0, 1);

    earthState?.tweets.forEach(({score, loc, time}) => {
      if (Date.parse(time) >= limitTime && loc) {
        addWave(loc[0], loc[1], score);
      }
    });
  }, [earthState]); // 一分前までのツイートを抽出して波を発生させる関数を呼ぶ


  const {scene} = useThree();

  const emitters = useRef<Emitter[]>([]);
  const system = useRef();

  const zone = new PointZone(0, 0);
  function createSprite() {
    const map = new TextureLoader()
        .load('./assets/textures/particle_texture.png');
    const material = new SpriteMaterial({
      map: map,
      color: 0x4cd3c2,
      blending: AdditiveBlending,
      fog: true,
    });
    return new Sprite(material);
  }
  const addWave = (latitude: number, longitude: number, score: number) => {
    emitters.current.push(new Emitter());
    // @ts-ignore
    emitters.current[emitters.current.length - 1]
        .setRate(new Rate(new Span(2, 3), new Span(0.01)))
        .setInitializers([
          new Position(zone),
          new Mass(60),
          new Radius(0.04, 0.08),
          new Life(30),
          new Body(createSprite()),
          new RadialVelocity(6, new Vector3D(0, -0.1, 0), 18),
        ])
        .setBehaviours([new Alpha(1, 0), new Scale(0.5, 0.8),
          new Color('#FF00E5')])
        .emit();
    system.current &&
    // @ts-ignore
    system.current.addEmitter(emitters.current[emitters.current.length - 1]);
    emitters
        .current[emitters.current.length - 1]
        .rotation =
        new Euler(0,
            longitude * 2 * Math.PI/360,
            (latitude-90) * 2 * Math.PI/360);
    setInterval(rotateEarth,
        100,
        latitude,
        longitude,
        emitters.current[emitters.current.length-1]);
  };

  function rotateEarth(latitude: number, longitude: number, emitter: Emitter) {
    const time = new Date(Date.now());
    const second = time.getSeconds() + time.getMilliseconds()/1000;
    const earthRotation = 2 * Math.PI * second/60;
    const longtitudeRotation = (longitude) * 2 * Math.PI/360;
    emitter.rotation.y = longtitudeRotation + earthRotation;

    function calculateLongitude(val: number) {
      if (val<=180) {
        return val;
      } else {
        return val-360;
      }
    }

    const pos =
        translateGeoCoords(latitude,
            calculateLongitude(longitude + (second * 6)), 1.0);
    emitter.position = pos;
  }

  useEffect(() => {
    system.current = new System();
    const renderer = new SpriteRenderer(scene, THREE);
    // @ts-ignore
    system.current
        .addRenderer(renderer);

    return () => {
      emitters.current.forEach((emit) => {
        emit.destroy();
      });
      // @ts-ignore
      system.current.destroy();
    };
  }, [scene]);


  useFrame(({clock}) => {
    // @ts-ignore
    system.current.update();
    // tha.current += Math.PI / 150;
    //
    // // @ts-ignore
    //
    // // @ts-ignore
    //
    // ctha.current += 0.016;
    // r.current = 300;
  });

  return null;
};
