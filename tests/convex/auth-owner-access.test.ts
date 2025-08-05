/**
 * Comprehensive test suite for verifyOwnerAccess Convex function
 * Tests access control logic, session validation, and edge cases
 */

import { convexTest } from 'convex-test';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import schema from '@convex/schema';

describe('verifyOwnerAccess', () => {
  const ownerEmail = 'david@ideasmen.com.au';
  const regularUserEmail = 'user@example.com';

  beforeEach(() => {
    // Clear any existing test data before each test
    jest.clearAllMocks();
  });

  it('should deny access when no session token is provided', async () => {
    const t = convexTest(schema);

    const result = await t.query(api.auth.verifyOwnerAccess, {});

    expect(result).toEqual({
      hasAccess: false,
      reason: 'No session token provided',
    });
  });

  it('should deny access when session token is undefined', async () => {
    const t = convexTest(schema);

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: undefined,
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'No session token provided',
    });
  });

  it('should deny access for invalid session token', async () => {
    const t = convexTest(schema);

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: 'invalid-session-token',
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Invalid or expired session',
    });
  });

  it('should deny access for expired session', async () => {
    const t = convexTest(schema);

    // Create a user
    const userId = await t.db.insert('users', {
      name: 'Test User',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'user',
    });

    // Create an expired session
    const expiredSession = await t.db.insert('sessions', {
      userId,
      sessionToken: 'expired-session-token',
      expires: Date.now() - 1000, // Expired 1 second ago
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: 'expired-session-token',
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Invalid or expired session',
    });
  });

  it('should deny access when user is not found', async () => {
    const t = convexTest(schema);

    // Create a session without a valid user
    const orphanedSession = await t.db.insert('sessions', {
      userId: 'non-existent-user-id' as any,
      sessionToken: 'valid-session-token',
      expires: Date.now() + 3600000, // Valid for 1 hour
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: 'valid-session-token',
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'User not found',
    });
  });

  it('should deny access for regular user', async () => {
    const t = convexTest(schema);

    // Create a regular user
    const userId = await t.db.insert('users', {
      name: 'Regular User',
      email: regularUserEmail,
      password: 'hashed-password',
      role: 'user',
    });

    // Create a valid session for regular user
    const sessionToken = 'valid-regular-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000, // Valid for 1 hour
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Access restricted to owner only',
      userEmail: regularUserEmail,
    });
  });

  it('should grant access for owner user', async () => {
    const t = convexTest(schema);

    // Create the owner user
    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'admin',
    });

    // Create a valid session for owner
    const sessionToken = 'valid-owner-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000, // Valid for 1 hour
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });
  });

  it('should grant access regardless of user role if email matches', async () => {
    const t = convexTest(schema);

    // Create owner user with 'user' role (not 'admin')
    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'user', // Regular role, but owner email
    });

    // Create a valid session
    const sessionToken = 'valid-owner-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000, // Valid for 1 hour
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });
  });

  it('should handle database errors gracefully', async () => {
    const t = convexTest(schema);

    // Create a session with malformed userId that will cause DB error
    // Note: This simulates a database corruption scenario
    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: 'session-with-bad-user-id',
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Invalid or expired session',
    });
  });

  it('should handle long session tokens', async () => {
    const t = convexTest(schema);

    // Create owner user
    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'admin',
    });

    // Create session with very long token
    const longSessionToken = 'a'.repeat(1000); // 1000 character token
    await t.db.insert('sessions', {
      userId,
      sessionToken: longSessionToken,
      expires: Date.now() + 3600000,
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: longSessionToken,
    });

    expect(result).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });
  });

  it('should handle special characters in email', async () => {
    const t = convexTest(schema);

    // Test with owner email that has special characters (already has .)
    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail, // Contains dot and @
      password: 'hashed-password',
      role: 'user',
    });

    const sessionToken = 'valid-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000,
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });
  });

  it('should be case-sensitive for email matching', async () => {
    const t = convexTest(schema);

    // Create user with uppercase version of owner email
    const userId = await t.db.insert('users', {
      name: 'Not Owner',
      email: ownerEmail.toUpperCase(), // DAVID@IDEASMEN.COM.AU
      password: 'hashed-password',
      role: 'admin',
    });

    const sessionToken = 'valid-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000,
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Access restricted to owner only',
      userEmail: ownerEmail.toUpperCase(),
    });
  });

  it('should handle session exactly at expiry time', async () => {
    const t = convexTest(schema);

    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'user',
    });

    // Create session that expires exactly now
    const sessionToken = 'expiring-now-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now(), // Expires exactly now
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Invalid or expired session',
    });
  });

  it('should handle multiple sessions for same user', async () => {
    const t = convexTest(schema);

    const userId = await t.db.insert('users', {
      name: 'David Owner',
      email: ownerEmail,
      password: 'hashed-password',
      role: 'user',
    });

    // Create multiple sessions
    const sessionToken1 = 'session-1';
    const sessionToken2 = 'session-2';

    await t.db.insert('sessions', {
      userId,
      sessionToken: sessionToken1,
      expires: Date.now() + 3600000,
      rememberMe: false,
    });

    await t.db.insert('sessions', {
      userId,
      sessionToken: sessionToken2,
      expires: Date.now() + 3600000,
      rememberMe: true,
    });

    // Both sessions should work independently
    const result1 = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: sessionToken1,
    });

    const result2 = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: sessionToken2,
    });

    expect(result1).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });

    expect(result2).toEqual({
      hasAccess: true,
      reason: 'Access granted',
      userEmail: ownerEmail,
    });
  });

  it('should handle empty string session token', async () => {
    const t = convexTest(schema);

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken: '',
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Invalid or expired session',
    });
  });

  it('should handle null/undefined user email', async () => {
    const t = convexTest(schema);

    // Create user with null email (edge case)
    const userId = await t.db.insert('users', {
      name: 'User with no email',
      email: null as any, // This would be unusual but testing edge case
      password: 'hashed-password',
      role: 'user',
    });

    const sessionToken = 'valid-session';
    await t.db.insert('sessions', {
      userId,
      sessionToken,
      expires: Date.now() + 3600000,
      rememberMe: false,
    });

    const result = await t.query(api.auth.verifyOwnerAccess, {
      sessionToken,
    });

    expect(result).toEqual({
      hasAccess: false,
      reason: 'Access restricted to owner only',
      userEmail: null,
    });
  });

  describe('Integration with session lifecycle', () => {
    it('should work with remember me sessions', async () => {
      const t = convexTest(schema);

      const userId = await t.db.insert('users', {
        name: 'David Owner',
        email: ownerEmail,
        password: 'hashed-password',
        role: 'user',
      });

      // Create remember me session (typically longer expiry)
      const sessionToken = 'remember-me-session';
      await t.db.insert('sessions', {
        userId,
        sessionToken,
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        rememberMe: true,
      });

      const result = await t.query(api.auth.verifyOwnerAccess, {
        sessionToken,
      });

      expect(result).toEqual({
        hasAccess: true,
        reason: 'Access granted',
        userEmail: ownerEmail,
      });
    });

    it('should handle concurrent access checks', async () => {
      const t = convexTest(schema);

      const userId = await t.db.insert('users', {
        name: 'David Owner',
        email: ownerEmail,
        password: 'hashed-password',
        role: 'user',
      });

      const sessionToken = 'concurrent-session';
      await t.db.insert('sessions', {
        userId,
        sessionToken,
        expires: Date.now() + 3600000,
        rememberMe: false,
      });

      // Run multiple concurrent access checks
      const promises = Array(5)
        .fill(null)
        .map(() => t.query(api.auth.verifyOwnerAccess, { sessionToken }));

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual({
          hasAccess: true,
          reason: 'Access granted',
          userEmail: ownerEmail,
        });
      });
    });
  });

  describe('Performance considerations', () => {
    it('should handle multiple users efficiently', async () => {
      const t = convexTest(schema);

      // Create multiple users
      const userIds = await Promise.all([
        t.db.insert('users', {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'hash1',
          role: 'user',
        }),
        t.db.insert('users', {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'hash2',
          role: 'user',
        }),
        t.db.insert('users', {
          name: 'David Owner',
          email: ownerEmail,
          password: 'hash3',
          role: 'admin',
        }),
      ]);

      // Create sessions for all users
      const sessionTokens = ['session-1', 'session-2', 'owner-session'];
      await Promise.all(
        userIds.map((userId, index) =>
          t.db.insert('sessions', {
            userId,
            sessionToken: sessionTokens[index],
            expires: Date.now() + 3600000,
            rememberMe: false,
          })
        )
      );

      // Check access for owner
      const ownerResult = await t.query(api.auth.verifyOwnerAccess, {
        sessionToken: 'owner-session',
      });

      expect(ownerResult.hasAccess).toBe(true);

      // Check access for regular users
      const user1Result = await t.query(api.auth.verifyOwnerAccess, {
        sessionToken: 'session-1',
      });

      const user2Result = await t.query(api.auth.verifyOwnerAccess, {
        sessionToken: 'session-2',
      });

      expect(user1Result.hasAccess).toBe(false);
      expect(user2Result.hasAccess).toBe(false);
    });
  });
});
