import { mutation } from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';

// Migration to set default password for existing users
export const migrateUsersWithDefaultPassword = mutation({
  args: {},
  handler: async ctx => {
    // Get all users without passwords
    const users = await ctx.db.query('users').collect();
    const usersWithoutPasswords = users.filter(user => !user.password);

    if (usersWithoutPasswords.length === 0) {
      return { message: 'No users need password migration', updated: 0 };
    }

    // Hash the default password (using sync version for Convex)
    const defaultPassword = 'testpass123';
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);

    // Update each user without a password
    for (const user of usersWithoutPasswords) {
      await ctx.db.patch(user._id, {
        password: hashedPassword,
      });
    }

    return {
      message: `Migration complete: ${usersWithoutPasswords.length} users updated with default password`,
      updated: usersWithoutPasswords.length,
      defaultPassword: defaultPassword,
    };
  },
});

// Helper function to reset a specific user's password
export const resetUserPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password (using sync version for Convex)
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    await ctx.db.patch(user._id, {
      password: hashedPassword,
    });

    return { message: `Password reset for ${args.email}` };
  },
});
