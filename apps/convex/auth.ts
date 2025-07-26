/* eslint-disable no-console, no-undef, no-restricted-syntax, @typescript-eslint/no-unused-vars */
import {
  mutation,
  query,
  action,
  MutationCtx,
  QueryCtx,
  ActionCtx,
} from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';
import { api } from './_generated/api';
import { ConvexError } from 'convex/values';

// User registration mutation
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { name: string; email: string; password: string }
  ) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password before storing (using sync version for Convex)
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(args.password, saltRounds);

    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      role: 'user',
    });

    return { userId, email: args.email, name: args.name };
  },
});

// User login mutation (simplified)
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { email: string; password: string; rememberMe?: boolean }
  ) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify the password
    if (!user.password) {
      throw new Error('User account needs password reset');
    }

    const isPasswordValid = bcrypt.compareSync(args.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Create a session with secure random token generation
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    // Extended session for "Remember Me" (30 days) or regular session (24 hours)
    const sessionDuration = args.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for Remember Me
      : 24 * 60 * 60 * 1000; // 24 hours for regular login
    const expires = Date.now() + sessionDuration;

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
      rememberMe: args.rememberMe || false,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      sessionToken,
    };
  },
});

// Session verification query
export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken: string }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Logout mutation
export const logoutUser = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { sessionToken: string }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get current user query
export const getCurrentUser = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    if (!args.sessionToken) {
      return null;
    }

    // Verify session directly
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken!)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Change password mutation
export const changePassword = mutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { sessionToken: string; currentPassword: string; newPassword: string }
  ) => {
    // Verify session
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    if (!user.password) {
      throw new Error('User account needs password reset');
    }

    const isCurrentPasswordValid = bcrypt.compareSync(
      args.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    // Update user password
    await ctx.db.patch(user._id, {
      password: hashedNewPassword,
    });

    return { success: true };
  },
});

// Request password reset mutation
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { email: string }) => {
    // Find user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Generate secure random reset token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Clean up any existing tokens for this user
    const existingTokens = await ctx.db
      .query('password_reset_tokens')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.delete(existingToken._id);
    }

    // Create new reset token
    await ctx.db.insert('password_reset_tokens', {
      userId: user._id,
      token,
      expires,
    });

    // Send email with reset token (mock implementation)
    console.log('📧 MOCK EMAIL SENT - PASSWORD RESET');
    console.log('==================================');
    console.log(`To: ${args.email}`);
    console.log(`Token: ${token}`);
    console.log(
      `Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    );
    console.log(`Expires: ${new Date(expires).toISOString()}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
    console.log('==================================');

    return { success: true };
  },
});

// Reset password mutation
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { token: string; newPassword: string }
  ) => {
    // Find the reset token
    const resetToken = await ctx.db
      .query('password_reset_tokens')
      .withIndex('by_token', q => q.eq('token', args.token))
      .first();

    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    // Check if token is expired
    if (resetToken.expires < Date.now()) {
      // Clean up expired token
      await ctx.db.delete(resetToken._id);
      throw new Error('Invalid or expired token');
    }

    // Get user
    const user = await ctx.db.get(resetToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    // Update user password
    await ctx.db.patch(user._id, {
      password: hashedNewPassword,
    });

    // Clean up the used token
    await ctx.db.delete(resetToken._id);

    // Invalidate all existing sessions for this user for security
    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();

    for (const session of userSessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Helper mutation for GitHub OAuth database operations
export const createOrUpdateGitHubUser = mutation({
  args: {
    githubUser: v.object({
      id: v.number(),
      login: v.string(),
      name: v.optional(v.string()),
      email: v.string(),
      avatar_url: v.optional(v.string()),
    }),
    tokenData: v.object({
      access_token: v.string(),
      refresh_token: v.optional(v.string()),
      expires_in: v.optional(v.number()),
      token_type: v.optional(v.string()),
      scope: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      githubUser: {
        id: number;
        login: string;
        name?: string;
        email: string;
        avatar_url?: string;
      };
      tokenData: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
      };
    }
  ) => {
    const { githubUser, tokenData } = args;

    // Check if account already exists
    const existingAccount = await ctx.db
      .query('accounts')
      .withIndex('by_provider_account', q =>
        q
          .eq('provider', 'github')
          .eq('providerAccountId', githubUser.id.toString())
      )
      .first();

    let user;
    if (existingAccount) {
      // User exists, get their info
      user = await ctx.db.get(existingAccount.userId);
      if (!user) {
        throw new Error('User account not found');
      }

      // Update account tokens
      await ctx.db.patch(existingAccount._id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
      });
    } else {
      // Check if user exists by email
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', githubUser.email))
        .first();

      if (existingUser) {
        // Link GitHub account to existing user
        user = existingUser;
        await ctx.db.insert('accounts', {
          userId: user._id,
          type: 'oauth',
          provider: 'github',
          providerAccountId: githubUser.id.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });
      } else {
        // Create new user
        const userId = await ctx.db.insert('users', {
          name: githubUser.name || githubUser.login,
          email: githubUser.email,
          password: '', // OAuth users don't have passwords
          profile_image_url: githubUser.avatar_url,
          role: 'user',
        });

        // Create OAuth account record
        await ctx.db.insert('accounts', {
          userId: userId,
          type: 'oauth',
          provider: 'github',
          providerAccountId: githubUser.id.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });

        user = await ctx.db.get(userId);
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Create session with secure random token generation
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
      rememberMe: true, // OAuth sessions are long-lived by default
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
      },
      sessionToken,
    };
  },
});

// GitHub OAuth login action
export const githubOAuthLogin = action({
  args: {
    code: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { code: string; state?: string }
  ): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile_image_url?: string;
    };
    sessionToken: string;
  }> => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: args.code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          'GitHub token exchange error:',
          tokenResponse.status,
          tokenResponse.statusText
        );
        throw new Error(
          `GitHub OAuth token exchange failed: ${tokenResponse.status}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('GitHub token response:', {
        ...tokenData,
        access_token: '[REDACTED]',
      });

      if (tokenData.error) {
        console.error('GitHub OAuth error:', tokenData);
        throw new Error(
          `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`
        );
      }

      // Get user profile from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });

      if (!userResponse.ok) {
        console.error(
          'GitHub user API error:',
          userResponse.status,
          userResponse.statusText
        );
        throw new Error(
          `GitHub API error: ${userResponse.status} ${userResponse.statusText}`
        );
      }

      const githubUser = await userResponse.json();
      console.log('GitHub user data:', githubUser);

      if (!githubUser.id) {
        console.error('Invalid GitHub user data:', githubUser);
        throw new Error('Failed to get user information from GitHub');
      }

      // Get user email if not public
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/json',
            },
          }
        );
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e: { email: string; primary: boolean }) => e.primary
        );
        email =
          primaryEmail?.email || githubUser.login + '@users.noreply.github.com';
      }

      // Use helper mutation to handle database operations
      const result: {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          profile_image_url?: string;
        };
        sessionToken: string;
      } = await ctx.runMutation(api.auth.createOrUpdateGitHubUser, {
        githubUser: {
          id: githubUser.id,
          login: githubUser.login,
          name: githubUser.name,
          email: email,
          avatar_url: githubUser.avatar_url,
        },
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        },
      });

      return result;
    } catch (error: unknown) {
      console.error('GitHub OAuth error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GitHub OAuth login failed: ${errorMessage}`);
    }
  },
});

// Helper mutation for Google OAuth database operations
export const createOrUpdateGoogleUser = mutation({
  args: {
    googleUser: v.object({
      id: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      picture: v.optional(v.string()),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
    }),
    tokenData: v.object({
      access_token: v.string(),
      refresh_token: v.optional(v.string()),
      expires_in: v.optional(v.number()),
      token_type: v.optional(v.string()),
      scope: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      googleUser: {
        id: string;
        email: string;
        name?: string;
        picture?: string;
        given_name?: string;
        family_name?: string;
      };
      tokenData: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
      };
    }
  ) => {
    const { googleUser, tokenData } = args;

    // Check if account already exists
    const existingAccount = await ctx.db
      .query('accounts')
      .withIndex('by_provider_account', q =>
        q.eq('provider', 'google').eq('providerAccountId', googleUser.id)
      )
      .first();

    let user;
    if (existingAccount) {
      // User exists, get their info
      user = await ctx.db.get(existingAccount.userId);
      if (!user) {
        throw new Error('User account not found');
      }

      // Update account tokens
      await ctx.db.patch(existingAccount._id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
      });
    } else {
      // Check if user exists by email
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', googleUser.email))
        .first();

      if (existingUser) {
        // Link Google account to existing user
        user = existingUser;
        await ctx.db.insert('accounts', {
          userId: user._id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });
      } else {
        // Create new user
        const userId = await ctx.db.insert('users', {
          name:
            googleUser.name ||
            `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim() ||
            googleUser.email,
          email: googleUser.email,
          password: '', // OAuth users don't have passwords
          profile_image_url: googleUser.picture,
          role: 'user',
        });

        // Create OAuth account record
        await ctx.db.insert('accounts', {
          userId: userId,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });

        user = await ctx.db.get(userId);
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Create session with secure random token generation
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
      rememberMe: true, // OAuth sessions are long-lived by default
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
      },
      sessionToken,
    };
  },
});

// Google OAuth login action
export const googleOAuthLogin = action({
  args: {
    code: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { code: string; state?: string }
  ): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile_image_url?: string;
    };
    sessionToken: string;
  }> => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: args.code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        console.error(
          'Google token exchange error:',
          tokenResponse.status,
          tokenResponse.statusText
        );
        throw new Error(
          `Google OAuth token exchange failed: ${tokenResponse.status}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('Google token response:', {
        ...tokenData,
        access_token: '[REDACTED]',
      });

      if (tokenData.error) {
        console.error('Google OAuth error:', tokenData);
        throw new Error(
          `Google OAuth error: ${tokenData.error_description || tokenData.error}`
        );
      }

      // Get user profile from Google
      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!userResponse.ok) {
        console.error(
          'Google user API error:',
          userResponse.status,
          userResponse.statusText
        );
        throw new Error(
          `Google API error: ${userResponse.status} ${userResponse.statusText}`
        );
      }

      const googleUser = await userResponse.json();
      console.log('Google user data:', googleUser);

      if (!googleUser.id || !googleUser.email) {
        console.error('Invalid Google user data:', googleUser);
        throw new Error('Failed to get user information from Google');
      }

      // Use helper mutation to handle database operations
      const result: {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          profile_image_url?: string;
        };
        sessionToken: string;
      } = await ctx.runMutation(api.auth.createOrUpdateGoogleUser, {
        googleUser: {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          given_name: googleUser.given_name,
          family_name: googleUser.family_name,
        },
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        },
      });

      return result;
    } catch (error: unknown) {
      console.error('Google OAuth error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Google OAuth login failed: ${errorMessage}`);
    }
  },
});

// Get GitHub OAuth URL query
export const getGitHubOAuthUrl = query({
  args: {},
  handler: async (ctx: QueryCtx, _args: Record<string, never>) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error('GitHub OAuth not configured');
    }

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: state,
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state: state,
    };
  },
});

// Get Google OAuth URL query
export const getGoogleOAuthUrl = query({
  args: {},
  handler: async (ctx: QueryCtx, _args: Record<string, never>) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google OAuth not configured');
    }

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state: state,
    };
  },
});

// =======================
// Helper queries for authentication middleware
// =======================

/**
 * Find session by token (helper for ActionCtx)
 */
export const findSessionByToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
      .first();
  },
});

/**
 * Get user by ID (helper for ActionCtx)
 */
export const getUserById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// =======================
// LLM Access Control Functions (Story 4.2)
// =======================

/**
 * Check if user has LLM access based on database flag
 * Implements AC 8: User-based LLM access control with graceful fallback
 */
export const checkUserLLMAccess = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      
      if (!user) {
        return {
          hasLLMAccess: false,
          fallbackMessage: 'User not found. Please sign in to access chat features.',
        };
      }

      const hasAccess = user.hasLLMAccess === true;

      if (!hasAccess) {
        return {
          hasLLMAccess: false,
          fallbackMessage: `Hi ${user.name}! You're using the basic chat experience. To access our AI-powered responses with knowledge base integration, please contact david@ideasmen.com.au to request LLM access.`,
        };
      }

      return {
        hasLLMAccess: true,
        fallbackMessage: null,
      };
    } catch (error) {
      console.error('Error checking user LLM access:', (error as Error).message);
      return {
        hasLLMAccess: false,
        fallbackMessage: 'Unable to verify access. Please try again later.',
      };
    }
  },
});

/**
 * Update user LLM access (admin function)
 */
export const updateUserLLMAccess = mutation({
  args: {
    userId: v.id('users'),
    hasLLMAccess: v.boolean(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.userId, {
        hasLLMAccess: args.hasLLMAccess,
      });

      const user = await ctx.db.get(args.userId);
      console.log(`Updated LLM access for user ${user?.email}: ${args.hasLLMAccess}`);

      return { success: true };
    } catch (error) {
      console.error('Error updating user LLM access:', error);
      throw new ConvexError(`Failed to update user access: ${error.message}`);
    }
  },
});

/**
 * Log access control events for security monitoring
 */
export const logAccessEvent = mutation({
  args: {
    userId: v.id('users'),
    eventType: v.union(
      v.literal('access_granted'),
      v.literal('access_denied'),
      v.literal('access_requested')
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    console.log(`Access event: ${args.eventType} for user ${user?.email}`, {
      userId: args.userId,
      eventType: args.eventType,
      details: args.details,
      timestamp: Date.now(),
    });

    // In a production system, you might want to store these events
    // in a dedicated access_logs table for security analysis
  },
});
