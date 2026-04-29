import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  age: string;
  occupation: string;
  nativeLanguage: string;
  currentLanguages: string[];
  targetLanguages: string[];
  learningGoals: string[];
  proficiencyLevel: string;
  interests: string[];
  personalityTraits: string[];
  communicationStyle: string;
  challenges: string[];
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: String, default: "" },
    occupation: { type: String, default: "" },
    nativeLanguage: { type: String, default: "English" },
    currentLanguages: { type: [String], default: [] },
    targetLanguages: { type: [String], default: [] },
    learningGoals: { type: [String], default: [] },
    proficiencyLevel: { type: String, default: "Beginner (A1-A2)" },
    interests: { type: [String], default: [] },
    personalityTraits: { type: [String], default: [] },
    communicationStyle: { type: String, default: "Diplomatic" },
    challenges: { type: [String], default: [] },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
