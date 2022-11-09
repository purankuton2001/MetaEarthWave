import reportWebVitals from '../reportWebVitals';
import React, {useEffect, useRef, useState} from 'react';
import {TCanvas} from '../components/TCanvas';
import {NextPage} from 'next';
import {ModalPannel} from '../components/ModalPannel';
import {MessagePannel} from '../components/MessagePannel';
import {PointPannel} from '../components/PointPannel';
import {useSession, signIn, signOut} from 'next-auth/react';

export type ModalState = null | string;

const App: NextPage = () => {
  const {data} = useSession();
  const [modalState, setModalState] = useState<ModalState>(null);
  const changeModalState = (state: ModalState) => {
    setModalState(state);
  };

  return (
    <div style={{width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden'}}>
      <div className={'pointPannel'} onClick={signIn}/>
      {/* <PointPannel />*/}
      <MessagePannel modalState={modalState}/>
      <ModalPannel />
      <TCanvas />
    </div>
  );
};


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
export default App;
