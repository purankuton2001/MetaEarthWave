import {Box} from '@chakra-ui/react';
import type {NextPage} from 'next';
import {Canvas, useLoader} from '@react-three/fiber';
import {useWindowSize} from '../hooks/useWindowSize';
import {Stage, useTexture} from '@react-three/drei';
import Earth from '../components/Earth';


const Home: NextPage = () => {
  const {width, height} = useWindowSize();
  return (
    <Box w={width} h={height}>
      <Canvas>
        <ambientLight />
        <Earth position={[0, 0, 2.5]}/>
      </Canvas>
    </Box> );
};

export default Home;
