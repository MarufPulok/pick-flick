/**
 * User Model
 * Core user entity with authentication reference
 */

import { Schema, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    /**
     * Email address (unique identifier)
     */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    
    /**
     * Display name
     */
    name: {
      type: String,
      trim: true,
    },
    
    /**
     * Profile image URL
     */
    image: {
      type: String,
    },
    
    /**
     * Auth provider ID (from BetterAuth)
     */
    authProviderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    /**
     * Whether email is verified
     */
    emailVerified: {
      type: Boolean,
      default: false,
    },
    
    /**
     * Whether onboarding is complete
     */
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Note: email and authProviderId indexes are created by unique: true

// Types
export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

// Model (handle hot reload in development)
export const UserModel = models.User || model<User>('User', userSchema);
