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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@plankton_2022" />
        <meta name="twitter:title" content="MetaEarthWave" />
        <meta
          name="twitter:description"
          content="Make waves on the planet with your tweets" />
        <meta
          name="twitter:image:src"
          content="https://www.meta-earth-wave.art/assets/images/MetaEarthWave.png" />

        <meta property="og:site_name" content="MetaEarthWave" />
        <meta property="og:url" content="https://www.meta-earth-wave.art" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MetaEarthWave" />
        <meta
          property="og:description"
          content="Make waves on the planet with your tweets" />
        <meta
          property="og:image"
          content="https://www.meta-earth-wave.art/assets/images/MetaEarthWave.png" />
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width" />
      </Head>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>


  );
}

export default MyApp;
