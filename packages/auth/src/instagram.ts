/**
 * Instagram OAuth Configuration
 * Separate configuration for Instagram authentication
 */
interface TokenExchangeParams {
    code: string;
    redirectURI: string;
}

interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    raw: any;
}

interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    emailVerified: boolean;
}

/**
 * Exchange authorization code for access token
 */
export async function getInstagramToken({
    code,
    redirectURI,
}: TokenExchangeParams): Promise<TokenResponse> {
    console.log("[Instagram OAuth] Exchanging code for token...");

    const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID as string,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET as string,
        grant_type: "authorization_code",
        redirect_uri: redirectURI,
        code,
    });

    // Exchange for short-lived token
    const response = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    const responseText = await response.text();
    console.log("[Instagram OAuth] Token exchange status:", response.status);

    let data: any;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("[Instagram OAuth] Token exchange non-JSON response:", responseText);
        throw new Error("Instagram token exchange returned a non-JSON response");
    }

    const tokenPayload = Array.isArray(data?.data) ? data.data[0] : data;

    if (!response.ok || tokenPayload?.error_type || tokenPayload?.error_message || data?.error_type || data?.error_message) {
        console.error("[Instagram OAuth] Token exchange error:", data);
        throw new Error(
            tokenPayload?.error_message ||
                tokenPayload?.error_description ||
                data?.error_message ||
                data?.error_description ||
                "Failed to exchange code for token"
        );
    }

    // Exchange for long-lived token
    console.log("[Instagram OAuth] Exchanging for long-lived token...");

    const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenPayload.access_token}`
    );

    const longLivedText = await longLivedResponse.text();
    const longLivedData = JSON.parse(longLivedText);

    if (longLivedData.error) {
        console.error("[Instagram OAuth] Long-lived token error:", longLivedData.error);
        // Fall back to short-lived token
        return {
            accessToken: tokenPayload.access_token,
            refreshToken: undefined,
            accessTokenExpiresAt: undefined,
            raw: tokenPayload,
        };
    }

    return {
        accessToken: longLivedData.access_token || tokenPayload.access_token,
        refreshToken: undefined,
        accessTokenExpiresAt: longLivedData.expires_in
            ? new Date(Date.now() + longLivedData.expires_in * 1000)
            : undefined,
        raw: { ...tokenPayload, ...longLivedData },
    };
}

/**
 * Get Instagram user information
 */
export async function getInstagramUserInfo(tokens: any): Promise<UserProfile | null> {
    const accessToken = tokens.accessToken;

    if (!accessToken) {
        return null;
    }

    console.log("[Instagram OAuth] Fetching user info...");

    const userId = tokens.raw?.user_id as string | undefined;

    // Fetch user profile from Instagram API with Instagram Login
    const response = await fetch(
        `https://graph.instagram.com/v24.0/me?fields=user_id,username,account_type,profile_picture_url&access_token=${accessToken}`
    );

    const responseText = await response.text();
    console.log("[Instagram OAuth] User info status:", response.status);

    const data = JSON.parse(responseText);
    const userPayload = Array.isArray(data?.data) ? data.data[0] : data;

    if (userPayload?.error || data?.error) {
        const err = userPayload?.error || data?.error;
        console.error("[Instagram OAuth] User info error:", err);
        throw new Error(`Instagram API Error: ${err.message || "Unknown error"}`);
    }

    const finalId = userPayload.user_id || userPayload.id || userId;
    if (!finalId) {
        throw new Error("No Instagram user ID found");
    }

    return {
        id: finalId,
        name: userPayload.username || `instagram_user_${finalId}`,
        email: `instagram_${finalId}@vendly.local`,
        image: undefined,
        emailVerified: true,
    };
}