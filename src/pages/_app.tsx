import './index.css';
import type {AppProps} from 'next/app';
import {ChakraProvider} from '@chakra-ui/react';
import {SessionProvider} from 'next-auth/react';
import Head from 'next/head';

function MyApp({Component, pageProps: {session, ...pageProps}}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>MetaEarthWave</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>


  );
}

export default MyApp;
