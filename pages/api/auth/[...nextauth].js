import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getToken } from "hooks/api";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, metadata }) {
      if (account.provider === "google") {
        // get jwt from api
        const res = await getToken(account.id_token);
        user.accessToken = res.token;
        return true;
      }

      return false;
    },

    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.SECRET,
};

export default NextAuth(authOptions);
