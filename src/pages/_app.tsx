import './index.css';
import type {AppProps} from 'next/app';
import {ChakraProvider} from '@chakra-ui/react';
import {SessionProvider} from 'next-auth/react';
import Head from 'next/head';
import {EarthRotationProvider} from '../context/useEarthRotation';

function MyApp({Component, pageProps: {session, ...pageProps}}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>MetaEarthWave</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={'true'} />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@plankton_2022" />
        <meta name="twitter:title" content="MetaEarthWave" />
        <meta
          name="twitter:description"
          content="Make waves on the planet with your tweets" />
        <meta
          name="twitter:image:src"
          content="https://www.meta-earth-wave.art/assets/images/MetaEarthWaveTwitter.png" />

        <meta property="og:site_name" content="MetaEarthWave" />
        <meta property="og:url" content="https://www.meta-earth-wave.art" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MetaEarthWave" />
        <meta
          property="og:description"
          content="Make waves on the planet with your tweets" />
        <meta
          property="og:image"
          content="./assets/images/MetaEarthWaveTwitter.png" />

      </Head>
      <ChakraProvider>
        <EarthRotationProvider>
          <Component {...pageProps} />
        </EarthRotationProvider>
      </ChakraProvider>
    </SessionProvider>


  );
}

export default MyApp;
