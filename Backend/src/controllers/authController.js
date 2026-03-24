const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AuthModel = require("../models/authModel.js");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || "https://acad-backend-ve2l.onrender.com/api/auth/google/callback";

const encodeState = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeState = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch (error) {
    return {};
  }
};

const redirectWithError = (res, message) => {
  res.redirect(
    `${FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(message || "Google login failed")}`
  );
};

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const state = decodeState(req.query.state);
          const selectedRole = state.role;
          const email = profile.emails?.[0]?.value || "";

          if (!email) {
            return done(null, false, { message: "Google account email not found." });
          }

          if (!selectedRole) {
            return done(null, false, { message: "Please select a role before using Google login." });
          }

          const user = await AuthModel.getUserByEmailAndRole(email, selectedRole);
          if (!user) {
            return done(null, false, {
              message: `No ${selectedRole} account exists for this Google email.`,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, user_id, role } = req.body;

      const user = await AuthModel.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.user_id !== user_id || user.role !== role) {
        return res.status(403).json({ message: "Invalid credentials" });
      }

      res.status(200).json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  googleLogin: (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res
        .status(503)
        .json({ message: "Google login is not configured on the server." });
    }

    const role = String(req.query.role || "").trim();
    if (!role) {
      return res.status(400).json({ message: "Role is required for Google login." });
    }

    const state = encodeState({ role });

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state,
      prompt: "select_account",
    })(req, res, next);
  },

  googleCallback: (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return redirectWithError(res, "Google login is not configured on the server.");
    }

    passport.authenticate("google", { session: false }, (error, user, info) => {
      if (error) {
        console.error("Google Login Error:", error);
        return redirectWithError(res, "Google login failed.");
      }

      if (!user) {
        return redirectWithError(res, info?.message || "Google login failed.");
      }

      const userParam = encodeURIComponent(JSON.stringify(user));
      return res.redirect(`${FRONTEND_URL}/auth/google/callback?user=${userParam}`);
    })(req, res, next);
  },
};

module.exports = AuthController;
