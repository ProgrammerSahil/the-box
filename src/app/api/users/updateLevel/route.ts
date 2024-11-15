// pages/api/users/updateLevel.ts
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

connect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { username, newLevel } = reqBody;

    // Find user and update level
    const user = await User.findOneAndUpdate(
      { username: username },
      { level: newLevel },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Level updated successfully",
      level: user.level
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}