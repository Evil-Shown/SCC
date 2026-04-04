import crypto from "crypto";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const upsertGoogleUserSession = async ({ profile, mode = "login" }) => {
  const googleId = profile?.id || "";
  const email = String(profile?.email || "").trim().toLowerCase();
  const name = String(profile?.name || profile?.given_name || "Google User").trim();
  const avatar = profile?.picture || "";

  if (!email) {
    throw new Error("missing_email");
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  const isNewUser = !user;

  if (!user) {
    user = new User({
      name,
      email,
      password: crypto.randomBytes(32).toString("hex"),
      role: "student",
      profilePicture: avatar,
      isVerified: Boolean(profile?.verified_email),
      authProvider: "google",
      googleId,
      googleEmail: email,
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (!user.googleEmail) user.googleEmail = email;
    if (!user.profilePicture && avatar) user.profilePicture = avatar;
    if (!user.isVerified && profile?.verified_email) user.isVerified = true;
    if (!user.authProvider || user.authProvider === "local") user.authProvider = "google";
    if (!user.name && name) user.name = name;
  }

  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return {
    userResponse: user.toJSON(),
    accessToken,
    refreshToken,
    isNewUser,
    mode,
  };
};
