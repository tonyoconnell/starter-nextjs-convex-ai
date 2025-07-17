import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';

// User registration mutation
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
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

    // Create a session with more secure token generation
    const sessionToken = bcrypt.hashSync(user._id + Date.now().toString(), 8);
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
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
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    if (!args.sessionToken) {
      return null;
    }

    return await verifySession(ctx, { sessionToken: args.sessionToken });
  },
});
