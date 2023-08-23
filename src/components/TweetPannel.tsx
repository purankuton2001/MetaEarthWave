import React, {useEffect, useState, VFC} from 'react';
import {useLanguage} from '../hooks/useLanguage';
import {useWebSocket} from '../context/WebSocket';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from '@chakra-ui/react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/router';
import {useGeoPosition} from '../hooks/useGeoPosition';
import {TwitterLoginButton} from './TwitterLoginButton';

type TweetPannelProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}
type SendTweetData = {
    name: string,
    image: string,
    tweetText: string,
    accessToken: string,
    accessTokenSecret: string,
    loc: number[],
}


export const TweetPannel: VFC<TweetPannelProps> =
    ({isOpen, onOpen, onClose}) => {
      const [tweetText, setTweetText] = useState<string>(null!);
      const session = useSession();
      const {data} = session;
      const earthState = useWebSocket();
      const loc = useGeoPosition();
      const sendTweet = (tweetText: string) => {
        const sendTweetData: SendTweetData = {
          tweetText,
          name: data?.user?.name as string,
          image: data?.user?.image as string,
          // @ts-ignore
          accessToken: data?.user?.token?.account.oauth_token,
          // @ts-ignore
          accessTokenSecret: data?.user?.token?.account.oauth_token_secret,
          loc: [loc[1], loc[0]],
        };
        earthState?.socket.send(JSON.stringify(sendTweetData));
      };
      return (
        <>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Tweet</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Textarea onChange={(e) => {
                  setTweetText(e.target.value);
                }} value={tweetText} minHeight={'144px'} />
              </ModalBody>
              <ModalFooter>
                {data && <Button colorScheme='blue' mr={3} onClick={() => {
                  sendTweet(tweetText);
                  onClose();
                }}>
                   Tweet
                </Button>}
                {!data && <TwitterLoginButton />}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      );
    };

