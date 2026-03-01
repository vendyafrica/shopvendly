/**
 * Instagram OAuth Configuration
 * Separate configuration for Instagram authentication
 */
interface TokenExchangeParams {
    code: string;
    redirectURI: string;
}

interface TokenResponse {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    raw?: Record<string, unknown>;
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

    let data: unknown;

    try {
        data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
        console.error("[Instagram OAuth] Token exchange non-JSON response:", responseText);
        throw new Error("Instagram token exchange returned a non-JSON response");
    }

    type TokenPayload = {
        data?: unknown;
        error_type?: unknown;
        error_message?: string;
        error_description?: string;
        access_token?: string;
        user_id?: string;
        username?: string;
    } & Record<string, unknown>;

    const tokenPayload = data as TokenPayload;
    const tokenData = Array.isArray(tokenPayload.data) ? (tokenPayload.data[0] as TokenPayload) : tokenPayload;

    if (
        !response.ok ||
        tokenPayload?.error_type ||
        tokenPayload?.error_message
    ) {
        console.error("[Instagram OAuth] Token exchange error:", data);
        throw new Error(
            tokenPayload?.error_message ||
                tokenPayload?.error_description ||
                "Failed to exchange code for token"
        );
    }

    // Exchange for long-lived token
    console.log("[Instagram OAuth] Exchanging for long-lived token...");

    const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${(tokenData as { access_token?: string })?.access_token}`
    );

    const longLivedText = await longLivedResponse.text();
    const longLivedData = JSON.parse(longLivedText) as {
        access_token?: string;
        expires_in?: number;
        error?: unknown;
    };

    if (longLivedData.error) {
        console.error("[Instagram OAuth] Long-lived token error:", longLivedData.error);
        // Fall back to short-lived token
        return {
            accessToken: (tokenData as { access_token?: string })?.access_token ?? "",
            refreshToken: undefined,
            accessTokenExpiresAt: undefined,
            raw: tokenData,
        };
    }

    return {
        accessToken: longLivedData.access_token || (tokenData as { access_token?: string })?.access_token || "",
        refreshToken: undefined,
        accessTokenExpiresAt: longLivedData.expires_in
            ? new Date(Date.now() + longLivedData.expires_in * 1000)
            : undefined,
        raw: { ...tokenData, ...longLivedData },
    };
}

/**
 * Get Instagram user information
 */
export async function getInstagramUserInfo(tokens: TokenResponse): Promise<UserProfile | null> {
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

    const data = JSON.parse(responseText) as { data?: unknown; error?: { message?: string }; user_id?: string; username?: string; id?: string };
    const userPayload = Array.isArray(data?.data) ? (data.data[0] as { error?: { message?: string }; user_id?: string; username?: string; id?: string }) : data;

    const apiError = userPayload?.error || data?.error;
    if (apiError) {
        const message = (apiError as { message?: string }).message ?? "Unknown error";
        console.error("[Instagram OAuth] User info error:", apiError);
        throw new Error(`Instagram API Error: ${message}`);
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