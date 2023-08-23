import React, {VFC} from 'react';
import {signIn} from 'next-auth/react';
import {useLanguage} from '../hooks/useLanguage';
import {tweetButton} from '../utils/translateText';


export const TwitterLoginButton: VFC<any> = ({style}: any) => {
  const language = useLanguage();
  return (
    <div onClick={() => signIn('twitter', {callbackUrl: '/?tweetBox=true'})}
      className={'tweetButton'} style={style}>
      {tweetButton(language)}
    </div>
  );
};

