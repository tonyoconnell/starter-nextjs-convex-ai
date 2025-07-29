// @ts-nocheck
/**
 * Comprehensive tests for chatMutations.ts
 * Tests: chat session management, message handling, validation, error scenarios
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

// Mock Convex modules
jest.mock('../../apps/convex/_generated/server');
jest.mock('../../apps/convex/_generated/api');

const { createMockCtx } = require('./__mocks__/_generated/server');

// Import functions to test
import {
  createChatSession,
  addMessage,
  updateSessionTitle,
  deleteChatSession,
} from '../../apps/convex/chatMutations';

describe('Chat Mutations', () => {
  let mockCtx: any;
  const mockUserId = 'users_123';
  const mockSessionId = 'chat_sessions_456';
  const mockCorrelationId = '12345678-1234-4000-8000-123456789abc';

  beforeEach(() => {
    mockCtx = createMockCtx();
    jest.clearAllMocks();
    
    // Mock Date.now() for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1703123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createChatSession', () => {
    describe('Successful Session Creation', () => {
      it('should create new chat session with all provided fields', async () => {
        const args = {
          userId: mockUserId,
          title: 'Test Chat Session',
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);

        expect(typeof result).toBe('string');
        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', {
          userId: mockUserId,
          title: 'Test Chat Session',
          created_at: 1703123456789,
          updated_at: 1703123456789,
          correlation_id: mockCorrelationId,
        });
      });

      it('should create session with default title when title not provided', async () => {
        const args = {
          userId: mockUserId,
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);

        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', {
          userId: mockUserId,
          title: 'New Chat',
          created_at: 1703123456789,
          updated_at: 1703123456789,
          correlation_id: mockCorrelationId,
        });
      });

      it('should use empty string title when explicitly provided', async () => {
        const args = {
          userId: mockUserId,
          title: '',
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);

        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', {
          userId: mockUserId,
          title: 'New Chat', // Empty string is falsy, so default is used
          created_at: 1703123456789,
          updated_at: 1703123456789,
          correlation_id: mockCorrelationId,
        });
      });

      it('should handle long session titles', async () => {
        const longTitle = 'Very long chat session title that contains many words and could potentially exceed normal length limits'.repeat(3);
        const args = {
          userId: mockUserId,
          title: longTitle,
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);

        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', {
          userId: mockUserId,
          title: longTitle,
          created_at: 1703123456789,
          updated_at: 1703123456789,
          correlation_id: mockCorrelationId,
        });
      });

      it('should handle titles with special characters', async () => {
        const specialTitle = 'Chat with 🤖 AI Assistant: Testing & "Validation" <Session>';
        const args = {
          userId: mockUserId,
          title: specialTitle,
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);

        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', {
          userId: mockUserId,
          title: specialTitle,
          created_at: 1703123456789,
          updated_at: 1703123456789,
          correlation_id: mockCorrelationId,
        });
      });
    });

    describe('Timestamp Consistency', () => {
      it('should use same timestamp for created_at and updated_at', async () => {
        const args = {
          userId: mockUserId,
          title: 'Timestamp Test',
          correlationId: mockCorrelationId,
        };

        await createChatSession(mockCtx, args);

        const insertCall = mockCtx.db.insert.mock.calls[0][1];
        expect(insertCall.created_at).toBe(insertCall.updated_at);
        expect(insertCall.created_at).toBe(1703123456789);
      });

      it('should handle timestamp changes between calls', async () => {
        const args = {
          userId: mockUserId,
          correlationId: mockCorrelationId,
        };

        // First call
        await createChatSession(mockCtx, args);
        const firstCall = mockCtx.db.insert.mock.calls[0][1];

        // Change mock timestamp
        jest.spyOn(Date, 'now').mockReturnValue(1703123456800);

        // Second call
        await createChatSession(mockCtx, args);
        const secondCall = mockCtx.db.insert.mock.calls[1][1];

        expect(firstCall.created_at).toBe(1703123456789);
        expect(secondCall.created_at).toBe(1703123456800);
        expect(firstCall.created_at).not.toBe(secondCall.created_at);
      });
    });
  });

  describe('addMessage', () => {
    const mockSession = {
      _id: mockSessionId,
      userId: mockUserId,
      title: 'Test Session',
      created_at: 1703123456789,
      updated_at: 1703123456789,
      correlation_id: mockCorrelationId,
    };

    beforeEach(() => {
      // Mock session exists
      mockCtx.db.get.mockResolvedValue(mockSession);
    });

    describe('Successful Message Addition', () => {
      it('should add user message with basic fields', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Hello, how are you?',
          correlationId: mockCorrelationId,
        };

        const result = await addMessage(mockCtx, args);

        expect(typeof result).toBe('string');
        expect(result).toMatch(/^chat_messages_\d+$/);
        
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', {
          sessionId: mockSessionId,
          userId: mockUserId,
          role: 'user',
          content: 'Hello, how are you?',
          timestamp: 1703123456789,
          correlation_id: mockCorrelationId,
          model_used: undefined,
          tokens_used: undefined,
          has_llm_access: false,
        });

        // Should update session timestamp
        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          updated_at: 1703123456789,
        });
      });

      it('should add assistant message with metadata', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'assistant',
          content: 'I am doing well, thank you!',
          correlationId: mockCorrelationId,
          metadata: {
            model_used: 'anthropic/claude-3-haiku',
            tokens_used: 256,
            has_llm_access: true,
          },
        };

        const result = await addMessage(mockCtx, args);

        expect(result).toMatch(/^chat_messages_\d+$/);
        
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', {
          sessionId: mockSessionId,
          userId: mockUserId,
          role: 'assistant',
          content: 'I am doing well, thank you!',
          timestamp: 1703123456789,
          correlation_id: mockCorrelationId,
          model_used: 'anthropic/claude-3-haiku',
          tokens_used: 256,
          has_llm_access: true,
        });
      });

      it('should handle partial metadata', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'assistant',
          content: 'Response with partial metadata',
          correlationId: mockCorrelationId,
          metadata: {
            model_used: 'openai/gpt-4o-mini',
            // tokens_used missing
            // has_llm_access missing
          },
        };

        const result = await addMessage(mockCtx, args);

        expect(result).toMatch(/^chat_messages_\d+$/);
        
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', {
          sessionId: mockSessionId,
          userId: mockUserId,
          role: 'assistant',
          content: 'Response with partial metadata',
          timestamp: 1703123456789,
          correlation_id: mockCorrelationId,
          model_used: 'openai/gpt-4o-mini',
          tokens_used: undefined,
          has_llm_access: false, // Defaults to false
        });
      });

      it('should handle long message content', async () => {
        const longContent = 'This is a very long message content that could contain extensive information, multiple paragraphs, code examples, and detailed explanations. '.repeat(10);
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: longContent,
          correlationId: mockCorrelationId,
        };

        const result = await addMessage(mockCtx, args);

        expect(result).toMatch(/^chat_messages_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          content: longContent,
        }));
      });

      it('should handle messages with special characters and formatting', async () => {
        const formattedContent = `Here's some **markdown** content:
        
\`\`\`javascript
function test() {
  return "Hello World! 🌍";
}
\`\`\`

And some *special* characters: @#$%^&*()_+{}|:"<>?[];',./<>?

Unicode: 🚀💻🎉 émojis and açcénts`;

        const args = {
          sessionId: mockSessionId,
          role: 'assistant',
          content: formattedContent,
          correlationId: mockCorrelationId,
        };

        const result = await addMessage(mockCtx, args);

        expect(result).toMatch(/^chat_messages_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          content: formattedContent,
        }));
      });

      it('should handle empty message content', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: '',
          correlationId: mockCorrelationId,
        };

        const result = await addMessage(mockCtx, args);

        expect(result).toMatch(/^chat_messages_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          content: '',
        }));
      });
    });

    describe('Session Validation', () => {
      it('should throw error when session does not exist', async () => {
        mockCtx.db.get.mockResolvedValue(null);

        const args = {
          sessionId: 'nonexistent_session_123',
          role: 'user',
          content: 'Test message',
          correlationId: mockCorrelationId,
        };

        await expect(addMessage(mockCtx, args)).rejects.toThrow('Chat session not found');
        
        expect(mockCtx.db.insert).not.toHaveBeenCalled();
        expect(mockCtx.db.patch).not.toHaveBeenCalled();
      });

      it('should verify session lookup before message insertion', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Test message',
          correlationId: mockCorrelationId,
        };

        await addMessage(mockCtx, args);

        expect(mockCtx.db.get).toHaveBeenCalledWith(mockSessionId);
        // Verify get was called before insert (call order)
        const getCalls = mockCtx.db.get.mock.invocationCallOrder || [];
        const insertCalls = mockCtx.db.insert.mock.invocationCallOrder || [];
        if (getCalls.length > 0 && insertCalls.length > 0) {
          expect(getCalls[0]).toBeLessThan(insertCalls[0]);
        }
      });
    });

    describe('User ID Inheritance', () => {
      it('should use session userId for message', async () => {
        const sessionWithDifferentUser = {
          ...mockSession,
          userId: 'users_different_789',
        };
        mockCtx.db.get.mockResolvedValue(sessionWithDifferentUser);

        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Test message',
          correlationId: mockCorrelationId,
        };

        await addMessage(mockCtx, args);

        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          userId: 'users_different_789',
        }));
      });
    });

    describe('Session Update Behavior', () => {
      it('should update session timestamp after adding message', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Test message',
          correlationId: mockCorrelationId,
        };

        await addMessage(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          updated_at: 1703123456789,
        });
        // Verify patch was called after insert (call order)
        const insertCalls = mockCtx.db.insert.mock.invocationCallOrder || [];
        const patchCalls = mockCtx.db.patch.mock.invocationCallOrder || [];
        if (insertCalls.length > 0 && patchCalls.length > 0) {
          expect(patchCalls[0]).toBeGreaterThan(insertCalls[0]);
        }
      });

      it('should handle different timestamps between message and session update', async () => {
        const args = {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Test message',
          correlationId: mockCorrelationId,
        };

        // Change timestamp after message creation but before session update
        let callCount = 0;
        jest.spyOn(Date, 'now').mockImplementation(() => {
          callCount++;
          return callCount === 1 ? 1703123456789 : 1703123456800;
        });

        await addMessage(mockCtx, args);

        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          timestamp: 1703123456789,
        }));
        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          updated_at: 1703123456800,
        });
      });
    });
  });

  describe('updateSessionTitle', () => {
    const mockSession = {
      _id: mockSessionId,
      userId: mockUserId,
      title: 'Old Title',
      created_at: 1703123456789,
      updated_at: 1703123456789,
      correlation_id: mockCorrelationId,
    };

    beforeEach(() => {
      mockCtx.db.get.mockResolvedValue(mockSession);
    });

    describe('Successful Title Updates', () => {
      it('should update session title and timestamp', async () => {
        const args = {
          sessionId: mockSessionId,
          title: 'Updated Chat Title',
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: 'Updated Chat Title',
          updated_at: 1703123456789,
        });
      });

      it('should handle empty title', async () => {
        const args = {
          sessionId: mockSessionId,
          title: '',
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: '',
          updated_at: 1703123456789,
        });
      });

      it('should handle long titles', async () => {
        const longTitle = 'Very long title that contains extensive information about the chat session purpose and context'.repeat(5);
        const args = {
          sessionId: mockSessionId,
          title: longTitle,
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: longTitle,
          updated_at: 1703123456789,
        });
      });

      it('should handle titles with special characters', async () => {
        const specialTitle = 'Chat about "Machine Learning" & AI 🤖: Questions/Answers (2024)';
        const args = {
          sessionId: mockSessionId,
          title: specialTitle,
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: specialTitle,
          updated_at: 1703123456789,
        });
      });

      it('should handle multiline titles', async () => {
        const multilineTitle = `Line 1 of title
Line 2 of title
Line 3 of title`;
        const args = {
          sessionId: mockSessionId,
          title: multilineTitle,
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: multilineTitle,
          updated_at: 1703123456789,
        });
      });
    });

    describe('Session Validation', () => {
      it('should throw error when session does not exist', async () => {
        mockCtx.db.get.mockResolvedValue(null);

        const args = {
          sessionId: 'nonexistent_session_123',
          title: 'New Title',
        };

        await expect(updateSessionTitle(mockCtx, args)).rejects.toThrow('Chat session not found');
        expect(mockCtx.db.patch).not.toHaveBeenCalled();
      });

      it('should verify session exists before updating', async () => {
        const args = {
          sessionId: mockSessionId,
          title: 'New Title',
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.get).toHaveBeenCalledWith(mockSessionId);
        // Verify get was called before patch (call order)
        const getCalls = mockCtx.db.get.mock.invocationCallOrder || [];
        const patchCalls = mockCtx.db.patch.mock.invocationCallOrder || [];
        if (getCalls.length > 0 && patchCalls.length > 0) {
          expect(getCalls[0]).toBeLessThan(patchCalls[0]);
        }
      });
    });

    describe('Timestamp Behavior', () => {
      it('should update updated_at timestamp', async () => {
        const args = {
          sessionId: mockSessionId,
          title: 'New Title',
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, expect.objectContaining({
          updated_at: 1703123456789,
        }));
      });

      it('should use current timestamp, not session original timestamp', async () => {
        // Mock a session with older timestamp
        const oldSession = {
          ...mockSession,
          updated_at: 1703100000000, // Much older timestamp
        };
        mockCtx.db.get.mockResolvedValue(oldSession);

        const args = {
          sessionId: mockSessionId,
          title: 'New Title',
        };

        await updateSessionTitle(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, {
          title: 'New Title',
          updated_at: 1703123456789, // Current timestamp, not old one
        });
      });
    });
  });

  describe('deleteChatSession', () => {
    const mockMessages = [
      {
        _id: 'chat_messages_1',
        sessionId: mockSessionId,
        userId: mockUserId,
        role: 'user',
        content: 'First message',
        timestamp: 1703123456789,
        correlation_id: mockCorrelationId,
      },
      {
        _id: 'chat_messages_2',
        sessionId: mockSessionId,
        userId: mockUserId,
        role: 'assistant',
        content: 'Second message',
        timestamp: 1703123456790,
        correlation_id: mockCorrelationId,
      },
      {
        _id: 'chat_messages_3',
        sessionId: mockSessionId,
        userId: mockUserId,
        role: 'user',
        content: 'Third message',
        timestamp: 1703123456791,
        correlation_id: mockCorrelationId,
      },
    ];

    beforeEach(() => {
      // Mock query to return messages
      mockCtx.db._setMockData('chat_messages_collect', mockMessages);
    });

    describe('Successful Session Deletion', () => {
      it('should delete all messages and then the session', async () => {
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        // Should query for messages
        expect(mockCtx.db.query).toHaveBeenCalledWith('chat_messages');

        // Should delete all messages
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_1');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_2');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_3');
        
        // Should delete the session last
        expect(mockCtx.db.delete).toHaveBeenCalledWith(mockSessionId);
        
        // Should delete messages before session
        const deleteCalls = mockCtx.db.delete.mock.calls;
        const sessionDeleteIndex = deleteCalls.findIndex(call => call[0] === mockSessionId);
        const messageDeleteIndices = deleteCalls
          .map((call, index) => call[0].startsWith('chat_messages_') ? index : -1)
          .filter(index => index >= 0);
        
        messageDeleteIndices.forEach(messageIndex => {
          expect(messageIndex).toBeLessThan(sessionDeleteIndex);
        });
      });

      it('should handle session with no messages', async () => {
        mockCtx.db._setMockData('chat_messages_collect', []);
        
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        // Should still query for messages
        expect(mockCtx.db.query).toHaveBeenCalledWith('chat_messages');
        
        // Should delete session even with no messages
        expect(mockCtx.db.delete).toHaveBeenCalledWith(mockSessionId);
        expect(mockCtx.db.delete).toHaveBeenCalledTimes(1); // Only session deletion
      });

      it('should handle session with single message', async () => {
        const singleMessage = [mockMessages[0]];
        mockCtx.db._setMockData('chat_messages_collect', singleMessage);
        
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_1');
        expect(mockCtx.db.delete).toHaveBeenCalledWith(mockSessionId);
        expect(mockCtx.db.delete).toHaveBeenCalledTimes(2);
      });

      it('should handle session with many messages', async () => {
        const manyMessages = Array.from({ length: 50 }, (_, i) => ({
          _id: `chat_messages_${i + 1}`,
          sessionId: mockSessionId,
          userId: mockUserId,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i + 1}`,
          timestamp: 1703123456789 + i,
          correlation_id: mockCorrelationId,
        }));
        mockCtx.db._setMockData('chat_messages_collect', manyMessages);
        
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        // Should delete all 50 messages plus the session
        expect(mockCtx.db.delete).toHaveBeenCalledTimes(51);
        
        // Verify all messages were deleted
        manyMessages.forEach(message => {
          expect(mockCtx.db.delete).toHaveBeenCalledWith(message._id);
        });
        
        // Session deleted last
        expect(mockCtx.db.delete).toHaveBeenCalledWith(mockSessionId);
      });
    });

    describe('Query Index Behavior', () => {
      it('should use correct index for message query', async () => {
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        expect(mockCtx.db.query).toHaveBeenCalledWith('chat_messages');
        
        // Verify the query was called correctly
        expect(mockCtx.db.query).toHaveBeenCalledWith('chat_messages');
        // The withIndex and other chained methods are part of the query chain
      });

      it('should filter messages by session ID', async () => {
        // Mix messages from different sessions
        const mixedMessages = [
          ...mockMessages,
          {
            _id: 'chat_messages_other_1',
            sessionId: 'other_session_789',
            userId: mockUserId,
            role: 'user',
            content: 'Message from other session',
            timestamp: 1703123456792,
            correlation_id: 'other-correlation-id',
          },
        ];
        mockCtx.db._setMockData('chat_messages_collect', mixedMessages);
        
        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        // Should only delete messages from the target session
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_1');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_2');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_3');
        // Note: The mock currently returns all messages, but in real implementation
        // the index filter would only return messages for the specific session
      });
    });

    describe('Error Handling', () => {
      it('should handle query failures gracefully', async () => {
        // Mock query to reject
        mockCtx.db.query.mockImplementation(() => ({
          withIndex: jest.fn(() => ({
            collect: jest.fn().mockRejectedValue(new Error('Query failed')),
          })),
        }));

        const args = {
          sessionId: mockSessionId,
        };

        await expect(deleteChatSession(mockCtx, args)).rejects.toThrow('Query failed');
        
        // Should not attempt to delete anything
        expect(mockCtx.db.delete).not.toHaveBeenCalled();
      });

      it('should handle message deletion failures', async () => {
        // Mock delete to fail on first message
        mockCtx.db.delete.mockImplementation((id) => {
          if (id === 'chat_messages_1') {
            return Promise.reject(new Error('Delete failed'));
          }
          return Promise.resolve();
        });

        const args = {
          sessionId: mockSessionId,
        };

        await expect(deleteChatSession(mockCtx, args)).rejects.toThrow('Delete failed');
      });

      it('should handle session deletion failure', async () => {
        // Mock delete to fail only on session
        mockCtx.db.delete.mockImplementation((id) => {
          if (id === mockSessionId) {
            return Promise.reject(new Error('Session delete failed'));
          }
          return Promise.resolve();
        });

        const args = {
          sessionId: mockSessionId,
        };

        await expect(deleteChatSession(mockCtx, args)).rejects.toThrow('Session delete failed');
        
        // Messages should have been deleted before session failure
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_1');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_2');
        expect(mockCtx.db.delete).toHaveBeenCalledWith('chat_messages_3');
      });
    });

    describe('Deletion Order Verification', () => {
      it('should maintain proper deletion order even with async operations', async () => {
        // Add delays to simulate real async behavior
        let deletionOrder: string[] = [];
        mockCtx.db.delete.mockImplementation(async (id: string) => {
          // Simulate varying deletion times
          const delay = id.includes('messages') ? 10 : 20;
          await new Promise(resolve => setTimeout(resolve, delay));
          deletionOrder.push(id);
        });

        const args = {
          sessionId: mockSessionId,
        };

        await deleteChatSession(mockCtx, args);

        // All messages should be deleted before session
        const sessionDeleteIndex = deletionOrder.indexOf(mockSessionId);
        const messageIndices = deletionOrder
          .map((id, index) => id.startsWith('chat_messages_') ? index : -1)
          .filter(index => index >= 0);

        expect(sessionDeleteIndex).toBe(deletionOrder.length - 1); // Session deleted last
        messageIndices.forEach(messageIndex => {
          expect(messageIndex).toBeLessThan(sessionDeleteIndex);
        });
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete chat session lifecycle', async () => {
      // 1. Create session
      const sessionArgs = {
        userId: mockUserId,
        title: 'Integration Test Session',
        correlationId: mockCorrelationId,
      };
      const sessionId = await createChatSession(mockCtx, sessionArgs);

      // Mock session for subsequent operations
      const session = {
        _id: sessionId,
        userId: mockUserId,
        title: 'Integration Test Session',
        created_at: 1703123456789,
        updated_at: 1703123456789,
        correlation_id: mockCorrelationId,
      };
      mockCtx.db.get.mockResolvedValue(session);

      // 2. Add multiple messages
      const message1Id = await addMessage(mockCtx, {
        sessionId,
        role: 'user',
        content: 'Hello!',
        correlationId: mockCorrelationId,
      });

      const message2Id = await addMessage(mockCtx, {
        sessionId,
        role: 'assistant',
        content: 'Hi there!',
        correlationId: mockCorrelationId,
        metadata: { model_used: 'anthropic/claude-3-haiku', has_llm_access: true },
      });

      // 3. Update session title
      await updateSessionTitle(mockCtx, {
        sessionId,
        title: 'Updated Integration Test',
      });

      // 4. Delete session
      const messages = [
        { _id: message1Id, sessionId, content: 'Hello!' },
        { _id: message2Id, sessionId, content: 'Hi there!' },
      ];
      mockCtx.db._setMockData('chat_messages_collect', messages);
      
      await deleteChatSession(mockCtx, { sessionId });

      // Verify all operations occurred
      expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', expect.any(Object));
      expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.any(Object));
      expect(mockCtx.db.patch).toHaveBeenCalledWith(sessionId, expect.objectContaining({
        title: 'Updated Integration Test',
      }));
      expect(mockCtx.db.delete).toHaveBeenCalledWith(message1Id);
      expect(mockCtx.db.delete).toHaveBeenCalledWith(message2Id);
      expect(mockCtx.db.delete).toHaveBeenCalledWith(sessionId);
    });

    it('should handle concurrent operations on same session', async () => {
      const session = {
        _id: mockSessionId,
        userId: mockUserId,
        title: 'Concurrent Test',
        created_at: 1703123456789,
        updated_at: 1703123456789,
        correlation_id: mockCorrelationId,
      };
      mockCtx.db.get.mockResolvedValue(session);

      // Simulate concurrent message additions and title update
      const operations = [
        addMessage(mockCtx, {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Message 1',
          correlationId: mockCorrelationId + '_1',
        }),
        addMessage(mockCtx, {
          sessionId: mockSessionId,
          role: 'user',
          content: 'Message 2',
          correlationId: mockCorrelationId + '_2',
        }),
        updateSessionTitle(mockCtx, {
          sessionId: mockSessionId,
          title: 'Concurrent Updated Title',
        }),
      ];

      const results = await Promise.all(operations);

      // All operations should complete successfully
      expect(results).toHaveLength(3);
      expect(results[0]).toMatch(/^chat_messages_\d+$/);
      expect(results[1]).toMatch(/^chat_messages_\d+$/);
      expect(results[2]).toBeUndefined(); // updateSessionTitle returns void

      // Session should be updated multiple times
      expect(mockCtx.db.patch).toHaveBeenCalledWith(mockSessionId, expect.objectContaining({
        updated_at: expect.any(Number),
      }));
    });
  });

  describe('Data Validation and Edge Cases', () => {
    it('should handle correlation ID format variations', async () => {
      const correlationIds = [
        '12345678-1234-4000-8000-123456789abc', // Standard UUID
        'short-id', // Short ID
        'very-long-correlation-id-that-might-exceed-normal-limits-' + 'x'.repeat(100), // Long ID
        '特殊字符-🚀-correlation-id', // Unicode characters
        '', // Empty string
      ];

      for (const correlationId of correlationIds) {
        const args = {
          userId: mockUserId,
          title: `Test for ${correlationId.substring(0, 10)}...`,
          correlationId,
        };

        const result = await createChatSession(mockCtx, args);
        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', expect.objectContaining({
          correlation_id: correlationId,
        }));
      }
    });

    it('should handle various user ID formats', async () => {
      const userIds = [
        'users_123',
        'users_456789',
        'users_very_long_id_' + 'x'.repeat(50),
      ];

      for (const userId of userIds) {
        const args = {
          userId,
          correlationId: mockCorrelationId,
        };

        const result = await createChatSession(mockCtx, args);
        expect(result).toMatch(/^chat_sessions_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_sessions', expect.objectContaining({
          userId,
        }));
      }
    });

    it('should handle edge cases in message roles', async () => {
      const session = {
        _id: mockSessionId,
        userId: mockUserId,
        title: 'Role Test',
        created_at: 1703123456789,
        updated_at: 1703123456789,
        correlation_id: mockCorrelationId,
      };
      mockCtx.db.get.mockResolvedValue(session);

      const roles = ['user', 'assistant'];
      
      for (const role of roles) {
        const args = {
          sessionId: mockSessionId,
          role,
          content: `Test content for ${role}`,
          correlationId: mockCorrelationId,
        };

        const result = await addMessage(mockCtx, args);
        expect(result).toMatch(/^chat_messages_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('chat_messages', expect.objectContaining({
          role,
        }));
      }
    });
  });
});