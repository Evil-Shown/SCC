import { google } from "googleapis";

const GOOGLE_SCOPES = ["openid", "email", "profile"];

const getDefaultApiUrl = (req) => {
	const fromEnv = process.env.API_URL;
	if (fromEnv) return fromEnv.replace(/\/$/, "");

	if (req) {
		const host = req.get("host") || `localhost:${process.env.PORT || 5000}`;
		const protocol = req.protocol || "http";
		return `${protocol}://${host}`.replace(/\/$/, "");
	}

	return `http://localhost:${process.env.PORT || 5000}`;
};

export const getGoogleAuthRedirectUri = (req) => {
	const explicit = process.env.GOOGLE_REDIRECT_URI;

	if (explicit) return explicit.replace(/\/$/, "");

	return `${getDefaultApiUrl(req)}/api/timetable/google-callback`;
};

export const getGoogleOAuthClient = (req) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = getGoogleAuthRedirectUri(req);

	if (!clientId || !clientSecret || !redirectUri) {
		throw new Error("Google OAuth environment variables are not configured");
	}

	return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const getGoogleOAuthScopes = () => GOOGLE_SCOPES;

export const getClientAppUrl = () => {
	return (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
};
