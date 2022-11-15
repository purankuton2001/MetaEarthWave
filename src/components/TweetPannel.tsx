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

type TweetPannelProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}
type SendTweetData = {
    tweetText: string,
    accessToken: string,
    accessTokenSecret: string,
}


export const TweetPannel: VFC<TweetPannelProps> =
    ({isOpen, onOpen, onClose}) => {
      const [tweetText, setTweetText] = useState<string>(null);
      const {data} = useSession();
      const earthState = useWebSocket();
      const sendTweet = (tweetText: string) => {
        const sendTweetData: SendTweetData = {
          tweetText,
          accessToken: data?.user?.token?.oauth_token,
          accessTokenSecret: data?.user?.token?.oauth_token_secret,
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
                <Button variant='ghost'>Cancel</Button>
                <Button colorScheme='blue' mr={3} onClick={() => {
                  sendTweet(tweetText);
                  onClose();
                }}>
                   Tweet
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      );
    };

