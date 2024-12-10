import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/utils/email";
import { validatePassword } from '@/lib/passwordValidation';
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { auth: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.userAuth.update({
      where: { userId: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(" ") },
        { status: 400 }
      );
    }

    // Hash the incoming token for comparison
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user by hashed reset token
    const userAuth = await prisma.userAuth.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!userAuth) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Generate new salt and hash password
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(password + passwordSalt, 10);

    // Update password and clear reset token
    await prisma.userAuth.update({
      where: { userId: userAuth.userId },
      data: {
        password: hashedPassword,
        passwordSalt: passwordSalt,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}