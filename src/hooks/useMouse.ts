import {useEffect, useState} from 'react';

export const useMouse = () => {
  const [mousePos, setMousePos] = useState({
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    const MouseMove = (e) => {
      setMousePos({mouseX: e.clientX, mouseY: e.clientY});
    };
    window.addEventListener('mousemove', MouseMove);
    return () => window.removeEventListener('mousemove', MouseMove);
  }, []);
  return mousePos;
};
