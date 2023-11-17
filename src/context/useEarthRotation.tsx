import React, {createContext, useReducer} from 'react';

// Reducer関数
const earthRotationReducer = (state:any, action:any) => {
  switch (action.type) {
    case 'SET_ROTATION':
      return {...state, earthRotation: action.payload};
    case 'TOGGLE_PLAYING':
      return {...state, playing: !state.playing};
    default:
      return state;
  }
};

// コンテキストの作成
export const EarthRotationContext = createContext({});

export const EarthRotationProvider = ({children}:any) => {
  // useReducerを使用して状態とdispatchを取得
  const [state, dispatch] = useReducer(earthRotationReducer, {
    earthRotation: 0,
    playing: true,
  });

  // コンテキストの値を定義
  const contextValue = {
    state,
    dispatch,
  };

  return (
  // Providerでコンテキストの値を提供
    <EarthRotationContext.Provider value={contextValue}>
      {children}
    </EarthRotationContext.Provider>
  );
};
