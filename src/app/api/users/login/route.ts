import {connect} from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Level1 from "@/app/game/levels/Level1";

connect();

export async function POST(request: NextRequest){
    try{
        const reqBody = await request.json();
        const {username, password} = reqBody;

        //check if user exists
        const user = await User.findOne({username});
        if(!user){
            return NextResponse.json({error: "User not found"},{status: 404})
        }
        //check if password is correct

        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword){
            return NextResponse.json({error: "Invalid password"},{status: 400})
        }
        //create token data

        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email,
            level: user.level
        }

        //create token
        const token = await jwt.sign(tokenData, process.env.JWT_TOKEN_SECRET!);

        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            level: user.level,
        });
        response.cookies.set("token", token, {
            httpOnly: true,
        });
        return response;

    }catch(e:any){
        return NextResponse.json({error: e.message},{status: 500})
    }
}