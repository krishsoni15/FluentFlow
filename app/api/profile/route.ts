import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

// GET - Fetch current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select("-passwordHash");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "An error occurred while fetching profile." }, { status: 500 });
  }
}

// POST - Update current user's profile with all onboarding fields
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      name,
      age,
      occupation,
      nativeLanguage,
      currentLanguages,
      targetLanguages,
      learningGoals,
      proficiencyLevel,
      interests,
      personalityTraits,
      communicationStyle,
      challenges,
    } = body;

    await connectToDatabase();

    const updateData: Record<string, unknown> = { onboardingComplete: true };

    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (nativeLanguage !== undefined) updateData.nativeLanguage = nativeLanguage;
    if (currentLanguages !== undefined) updateData.currentLanguages = currentLanguages;
    if (targetLanguages !== undefined) updateData.targetLanguages = targetLanguages;
    if (learningGoals !== undefined) updateData.learningGoals = learningGoals;
    if (proficiencyLevel !== undefined) updateData.proficiencyLevel = proficiencyLevel;
    if (interests !== undefined) updateData.interests = interests;
    if (personalityTraits !== undefined) updateData.personalityTraits = personalityTraits;
    if (communicationStyle !== undefined) updateData.communicationStyle = communicationStyle;
    if (challenges !== undefined) updateData.challenges = challenges;

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, select: "-passwordHash" }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating profile." },
      { status: 500 }
    );
  }
}
