import React, {VFC} from 'react';
import {useRouter} from 'next/router';
import {useLanguage} from '../hooks/useLanguage';
import {tweetButton} from '../utils/translateText';
import {gsap} from 'gsap';


export const TwitterLoginButton: VFC<any> = ({style}: any) => {
  const language = useLanguage();
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.push('/?tweetBox=true', undefined, {shallow: true})}
      onMouseEnter={(event) => {
        gsap.to('.tweetButton', {scale: 1.1, duration: 0.5});
      }}
      onMouseLeave={(event) => {
        gsap.to('.tweetButton', {scale: 1, duration: 0.5});
      }}
      className={'tweetButton'} style={style}>
      {tweetButton(language)}
    </button>
  );
};

