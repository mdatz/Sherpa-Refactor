import NextAuth from "next-auth"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from '../../../lib/mongodb';
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import db from '../../../lib/db';
import User from '../../../models/User';

export default NextAuth({

  // MongoDB Adapter
  adapter: MongoDBAdapter(clientPromise),

  // Cache public secret
  secret: process.env["NEXT_PUBLIC_SECRET"],

  // Configure one or more authentication providers
  providers: [
    
    EmailProvider({
      server: {
        host: process.env["EMAIL_SERVER_HOST"],
        port: process.env["EMAIL_SERVER_PORT"],
        auth: {
          user: process.env["EMAIL_SERVER_USER"],
          pass: process.env["EMAIL_SERVER_PASSWORD"]
        }
      },
      from: process.env["EMAIL_FROM"]
    }),
    
    GoogleProvider({
      clientId: process.env["GOOGLE_ID"],
      clientSecret: process.env["GOOGLE_SECRET"],
    }),

  ],
  callbacks: {
    session: async ({session, user}) => {
      session.user["id"] = user.id;
      session.user["role"] = user.role;
      return Promise.resolve(session);
    }
  },
  events: {

    // Add additional user fields to the user object
    // when a user is created
    async createUser(message) {

      const user = message.user;
      const time = new Date();

      //initialize db connection
      await db();

      // Update the user with the remaining fields
      await User.findOneAndUpdate({_id: user.id}, {
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: time,
        updatedAt: time,
        role: 'user',
      }, {
        new: false,
        upsert: true
      });

    }
  },
  theme: {
    colorScheme: 'dark', // "auto" | "dark" | "light"
    brandColor: '#014FAA', // Hex color code #33FF5D
    logo: '/Sherpa_Logo.png', // Absolute URL to image
  }
})