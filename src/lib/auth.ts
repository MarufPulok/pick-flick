import { connectToDatabase } from '@/infrastructure/db';
import { TasteProfileModel } from '@/infrastructure/db/models';
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
    
    async redirect({ url, baseUrl }) {
      // After sign in, check if user has completed onboarding
      if (url.startsWith(baseUrl)) {
        // Only intercept callbacks, not manual navigation
        if (url.includes('/api/auth/callback')) {
          try {
            await connectToDatabase();
            const session = await auth();
            
            if (session?.user?.id) {
              const profile = await TasteProfileModel.findOne({ 
                userId: session.user.id 
              });
              
              // Redirect to onboarding if no profile or incomplete
              if (!profile || !profile.complete) {
                return `${baseUrl}/onboarding`;
              }
            }
          } catch (error) {
            console.error('Redirect check error:', error);
          }
        }
        return url;
      }
      
      return baseUrl;
    },
  },
  
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
