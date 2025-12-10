/**
 * NextAuth Configuration
 * Authentication setup with Google OAuth and MongoDB
 */

import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const client = new MongoClient(process.env.MONGODB_URI!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  callbacks: {
    async session({ session, user }) {
      // Add user data to session
      if (session.user) {
        session.user.id = user.id;
        session.user.image = user.image;
        session.user.name = user.name;
        session.user.email = user.email;
      }
      return session;
    },
  },
  
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
