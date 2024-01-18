import React, {VFC} from 'react';
import {signIn} from 'next-auth/react';
import {useLanguage} from '../hooks/useLanguage';
import {tweetButton} from '../utils/translateText';
import {gsap} from 'gsap';


export const TwitterLoginButton: VFC<any> = ({style}: any) => {
  const language = useLanguage();
  return (
    <div onClick={() => signIn('twitter', {callbackUrl: '/?tweetBox=true'})}
      onMouseEnter={(event) => {
        gsap.to('.tweetButton', {scale: 1.1, duration: 0.5});
      }}
      onMouseLeave={(event) => {
        gsap.to('.tweetButton', {scale: 1, duration: 0.5});
      }}
      className={'tweetButton'} style={style}>
      {tweetButton(language)}
    </div>
  );
};

