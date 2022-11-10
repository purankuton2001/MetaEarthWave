/* eslint-disable new-cap */
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: <string>process.env.TWITTER_ID,
      clientSecret: <string>process.env.TWITTER_SECRET,
    }),
  ],
  secret: process.env.NEXT_PUBLIC_AUTHSECRET,
  session: {jwt: true},
  callbacks: {
    async jwt({token, account}: any) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.account = account;
      }
      return {...token};
    },
    async session({session, token, user}:any) {
      // Send properties to the client, like an access_token from a provider.
      // @ts-ignore
      session.user.token = token;
      return {...session};
    },
  },
};

// @ts-ignore
export default NextAuth(authOptions);
