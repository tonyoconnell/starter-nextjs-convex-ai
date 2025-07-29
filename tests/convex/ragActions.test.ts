import { runRAGQueryHandler } from '../../apps/convex/ragActions';
import { ConvexError } from 'convex/values';

// Mock the dependencies
const mockConfig = {
  llm: {
    openRouterApiKey: 'test-key',
    defaultModel: 'anthropic/claude-3-haiku',
    openAiApiKey: 'test-openai-key',
    fallbackModel: 'openai/gpt-3.5-turbo',
  },
  vectorize: {
    accountId: 'test-account',
    apiToken: 'test-token',
    databaseId: 'test-db',
  },
  environment: 'test',
};

jest.mock('../../apps/convex/lib/config', () => ({
  getConfig: jest.fn(() => mockConfig),
}));

jest.mock('../../apps/convex/knowledgeActions', () => ({
  queryVectorSimilarityHandler: jest.fn(),
}));

jest.mock('../../apps/convex/lib/contextAssembly', () => ({
  assembleContext: jest.fn(() => ({
    contextBlock: 'RELEVANT CONTEXT:\n\nTest context content',
    systemPrompt: 'You are an AI assistant with access to project documentation.',
    tokenEstimate: 150,
    chunksIncluded: 1,
    sources: ['test.md'],
  })),
}));

jest.mock('../../apps/convex/lib/aiProviders', () => ({
  getConfiguredModel: jest.fn(() => ({ id: 'anthropic/claude-3-haiku' })),
  getFallbackModel: jest.fn(() => ({ id: 'openai/gpt-3.5-turbo' })),
}));

jest.mock('../../apps/convex/lib/aiTools', () => ({
  getToolConfiguration: jest.fn(() => ({
    tools: {},
    maxSteps: 3,
  })),
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '12345678-1234-4567-8901-123456789abc'),
}));

describe('RAG Actions', () => {
  let mockContext: any;
  let mockStreamText: jest.Mock;
  let mockGetConfig: jest.Mock;
  let mockQueryVectorSimilarityHandler: jest.Mock;
  let mockAssembleContext: jest.Mock;
  let mockGetConfiguredModel: jest.Mock;
  let mockGetFallbackModel: jest.Mock;
  let mockGetToolConfiguration: jest.Mock;
  
  beforeEach(() => {
    mockContext = {
      auth: {
        getUserIdentity: jest.fn(),
      },
      runQuery: jest.fn(),
      runMutation: jest.fn(),
    };
    
    // Get mocked functions
    mockStreamText = require('ai').streamText as jest.Mock;
    mockGetConfig = require('../../apps/convex/lib/config').getConfig as jest.Mock;
    mockQueryVectorSimilarityHandler = require('../../apps/convex/knowledgeActions').queryVectorSimilarityHandler as jest.Mock;
    mockAssembleContext = require('../../apps/convex/lib/contextAssembly').assembleContext as jest.Mock;
    mockGetConfiguredModel = require('../../apps/convex/lib/aiProviders').getConfiguredModel as jest.Mock;
    mockGetFallbackModel = require('../../apps/convex/lib/aiProviders').getFallbackModel as jest.Mock;
    mockGetToolConfiguration = require('../../apps/convex/lib/aiTools').getToolConfiguration as jest.Mock;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset config to default (ensures OpenAI API key is available)
    mockGetConfig.mockReturnValue(mockConfig);
    
    // Set up default mock implementations
    mockStreamText.mockResolvedValue({
      textStream: (async function* () {
        yield 'Test ';
        yield 'response ';
        yield 'content';
      })(),
    });
    
    // Default context assembly mock
    mockAssembleContext.mockReturnValue({
      contextBlock: 'RELEVANT CONTEXT:\n\nTest context content',
      systemPrompt: 'You are an AI assistant with access to project documentation.',
      tokenEstimate: 150,
      chunksIncluded: 1,
      sources: ['test.md'],
    });
  });

  describe('runRAGQueryHandler', () => {
    describe('Authentication Integration', () => {
      it('should require authenticated user', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue(null);

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toThrow('Authentication required for RAG queries');
        
        expect(mockContext.auth.getUserIdentity).toHaveBeenCalledTimes(1);
      });
      
      it('should reject unauthenticated requests with proper error', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue(null);

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toBeInstanceOf(ConvexError);
      });
      
      it('should handle getCurrentUser failures gracefully', async () => {
        mockContext.auth.getUserIdentity.mockRejectedValue(new Error('Auth service unavailable'));

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toThrow('Auth service unavailable');
      });

      it('should require valid user', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({
          subject: 'user-123',
        });
        
        mockContext.runQuery.mockResolvedValue(null); // User not found

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toThrow('User not found');
        
        expect(mockContext.runQuery).toHaveBeenCalledWith(
          expect.anything(),
          { userId: 'user-123' }
        );
      });
    });

    describe('Tool Integration & Vector Search', () => {
      it('should call queryKnowledgeBase tool with correct parameters', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content',
              source_document: 'test.md',
              chunk_index: 0,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query about development',
        });

        expect(mockQueryVectorSimilarityHandler).toHaveBeenCalledWith(
          mockContext,
          {
            query: 'test query about development',
            topK: 5,
            includeContent: true,
          }
        );
      });
      
      it('should handle tool execution failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockRejectedValue(new Error('Vector search failed'));
        
        // Mock context assembly for empty results
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are an AI assistant for a Next.js + Convex development project.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });
        
        // Mock fallback response
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'I apologize, but I\'m experiencing technical difficulties accessing the AI service. Please try again in a moment.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.sources).toEqual([]);
        expect(result.response).toContain('technical difficulties');
      });
      
      it('should pass query, topK=5, includeContent=true to tool', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'specific query text',
        });

        expect(mockQueryVectorSimilarityHandler).toHaveBeenCalledWith(
          mockContext,
          expect.objectContaining({
            query: 'specific query text',
            topK: 5,
            includeContent: true,
          })
        );
      });
      
      it('should handle empty search results gracefully', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.sources).toEqual([]);
        expect(mockAssembleContext).toHaveBeenCalledWith(
          [],
          4000,
          true
        );
      });
      
      it('should apply relevance threshold filtering', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [
            {
              id: 'vec-1',
              score: 0.85, // Above threshold (0.7)
              chunk: {
                content: 'Relevant content',
                source_document: 'relevant.md',
                chunk_index: 0,
                metadata: {},
              },
            },
            {
              id: 'vec-2',
              score: 0.65, // Below threshold (0.7)
              chunk: {
                content: 'Less relevant content',
                source_document: 'irrelevant.md',
                chunk_index: 0,
                metadata: {},
              },
            },
          ],
          queryStats: { totalResults: 2, processingTimeMs: 100 },
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.sources).toHaveLength(1);
        expect(result.sources[0].source_document).toBe('relevant.md');
        expect(result.sources[0].relevance_score).toBe(0.85);
      });
    });

    describe('Context Assembly Integration', () => {
      it('should assemble context from tool results', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content about development',
              source_document: 'docs/guide.md',
              chunk_index: 0,
              metadata: { type: 'documentation' },
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(mockAssembleContext).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              content: 'Test content about development',
              source: 'docs/guide.md',
              score: 0.85,
              chunkIndex: 0,
              metadata: { type: 'documentation' },
            }),
          ]),
          4000,
          true
        );
      });
      
      it('should respect maxContextTokens parameter (default 4000)', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
          maxContextTokens: 2000,
        });

        expect(mockAssembleContext).toHaveBeenCalledWith(
          expect.any(Array),
          2000, // Custom maxContextTokens
          true
        );
      });
      
      it('should include metadata when includeMetadata=true', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
          includeMetadata: true,
        });

        expect(mockAssembleContext).toHaveBeenCalledWith(
          expect.any(Array),
          4000,
          true // includeMetadata
        );
      });
      
      it('should exclude metadata when includeMetadata=false', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
          includeMetadata: false,
        });

        expect(mockAssembleContext).toHaveBeenCalledWith(
          expect.any(Array),
          4000,
          false // includeMetadata
        );
      });
      
      it('should handle context assembly failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content',
              source_document: 'test.md',
              chunk_index: 0,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });
        
        mockAssembleContext.mockImplementation(() => {
          throw new Error('Context assembly failed');
        });

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toThrow('Failed to process RAG query: Context assembly failed');
      });
    });

    describe('AI Streaming & Claude Integration', () => {
      it('should stream responses using OpenRouter Claude model', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        
        // Reset context assembly to default behavior for this test
        mockAssembleContext.mockReturnValue({
          contextBlock: 'RELEVANT CONTEXT:\n\nTest context content',
          systemPrompt: 'You are an AI assistant with access to project documentation.',
          tokenEstimate: 150,
          chunksIncluded: 0,
          sources: [],
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(mockStreamText).toHaveBeenCalledWith(
          expect.objectContaining({
            model: { id: 'anthropic/claude-3-haiku' },
            messages: [
              {
                role: 'user',
                content: 'test query',
              },
            ],
            temperature: 0.1,
            maxTokens: 2000,
          })
        );
      });
      
      it('should use correct system prompt with assembled context', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        
        const customSystemPrompt = 'Custom system prompt with context';
        mockAssembleContext.mockReturnValue({
          contextBlock: 'Test context',
          systemPrompt: customSystemPrompt,
          tokenEstimate: 100,
          chunksIncluded: 0,
          sources: [],
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(mockStreamText).toHaveBeenCalledWith(
          expect.objectContaining({
            system: customSystemPrompt,
          })
        );
      });
      
      it('should handle streaming responses correctly', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        
        // Mock streaming response
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'Hello ';
            yield 'world! ';
            yield 'This is a test response.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.response).toBe('Hello world! This is a test response.');
      });
      
      it('should use proper model configuration (temperature=0.1, maxTokens=2000)', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(mockStreamText).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature: 0.1,
            maxTokens: 2000,
          })
        );
      });
      
      it('should handle AI API failures with fallback', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content',
              source_document: 'test.md',
              chunk_index: 0,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });
        
        // Mock primary model failure
        mockStreamText.mockRejectedValueOnce(new Error('API Error'));
        
        // Mock fallback success
        mockStreamText.mockResolvedValueOnce({
          textStream: (async function* () {
            yield 'Fallback response';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.response).toBe('Fallback response');
        expect(mockStreamText).toHaveBeenCalledTimes(2); // Primary + fallback
      });
      
      it('should include tool in model configuration', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        
        const mockToolConfig = {
          tools: { queryKnowledge: { function: 'mockTool' } },
          maxSteps: 5,
        };
        mockGetToolConfiguration.mockReturnValue(mockToolConfig);

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(mockGetToolConfiguration).toHaveBeenCalledWith(true, 'rag');
        expect(mockStreamText).toHaveBeenCalledWith(
          expect.objectContaining({
            tools: mockToolConfig.tools,
            maxSteps: mockToolConfig.maxSteps,
          })
        );
      });
    });

    describe('Message Storage & Database Integration', () => {
      it('should store user message before AI processing', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'user input message',
        });

        // Verify user message was stored first
        expect(mockContext.runMutation).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            sessionId: 'test-session',
            role: 'user',
            content: 'user input message',
            correlationId: '12345678-1234-4567-8901-123456789abc',
          })
        );
      });
      
      it('should store assistant response after completion', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        // Find the assistant message call
        const assistantCall = mockContext.runMutation.mock.calls.find(
          call => call[1].role === 'assistant'
        );
        
        expect(assistantCall).toBeTruthy();
        expect(assistantCall[1]).toEqual(
          expect.objectContaining({
            sessionId: 'test-session',
            role: 'assistant',
            content: 'Test response content',
            correlationId: '12345678-1234-4567-8901-123456789abc',
            metadata: expect.objectContaining({
              sources: expect.any(Array),
              processingTimeMs: expect.any(Number),
            }),
          })
        );
      });
      
      it('should include correlation IDs in all messages', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: false });
        mockContext.runMutation.mockResolvedValue('message-id');

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        
        // Verify all message storage calls include correlation ID
        mockContext.runMutation.mock.calls.forEach(call => {
          expect(call[1].correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        });
      });
      
      it('should include metadata (model, tokens, sources) in assistant message', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content',
              source_document: 'test.md',
              chunk_index: 0,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });

        await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        const assistantCall = mockContext.runMutation.mock.calls.find(
          call => call[1].role === 'assistant'
        );
        
        expect(assistantCall[1].metadata).toEqual(
          expect.objectContaining({
            sources: expect.arrayContaining([
              expect.objectContaining({
                source_document: 'test.md',
                chunk_index: 0,
                relevance_score: 0.85,
              }),
            ]),
            processingTimeMs: expect.any(Number),
          })
        );
      });
      
      it('should handle database storage failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: false });
        mockContext.runMutation.mockRejectedValue(new Error('Database connection failed'));

        // Should not throw error - graceful degradation
        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.response).toContain("I'd be happy to help, but I need access");
        expect(result.correlationId).toBeDefined();
      });
    });

    describe('Comprehensive Error Handling', () => {
      it('should handle vector search failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockRejectedValue(new Error('Vectorize API unavailable'));
        
        // Mock context assembly for empty results (graceful degradation)
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are an AI assistant for a Next.js + Convex development project.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });
        
        // Mock fallback response when vector search fails
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.sources).toEqual([]);
        expect(result.response).toContain('technical difficulties');
      });
      
      it('should handle AI API failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.85,
            chunk: {
              content: 'Test content',
              source_document: 'test.md',
              chunk_index: 0,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });
        
        mockStreamText.mockRejectedValue(new Error('OpenRouter API error'));
        
        // Mock no fallback model and assembly context with sources
        mockGetConfig.mockReturnValue({
          llm: {
            openRouterApiKey: 'test-key',
            defaultModel: 'anthropic/claude-3-haiku',
            fallbackModel: 'anthropic/claude-3-haiku', // Same as default, no fallback
          },
        });
        
        mockAssembleContext.mockReturnValue({
          contextBlock: 'RELEVANT CONTEXT:\n\nTest content from test.md',
          systemPrompt: 'You are an AI assistant with access to project documentation.',
          tokenEstimate: 150,
          chunksIncluded: 1,
          sources: ['test.md'],
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.response).toContain('technical difficulties');
        expect(result.response).toContain('test.md'); // Should include source info
      });
      
      it('should handle context assembly failures', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        
        mockAssembleContext.mockImplementation(() => {
          throw new Error('Token estimation failed');
        });

        await expect(
          runRAGQueryHandler(mockContext, {
            sessionId: 'test-session',
            message: 'test query',
          })
        ).rejects.toThrow('Failed to process RAG query: Token estimation failed');
      });
      
      it('should store error responses appropriately', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockRejectedValue(new Error('Vector DB offline'));
        
        // Mock context assembly for empty results
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are an AI assistant for a Next.js + Convex development project.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });
        
        // Mock error response
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        // Verify error response was still stored
        const assistantCall = mockContext.runMutation.mock.calls.find(
          call => call[1].role === 'assistant'
        );
        
        expect(assistantCall).toBeTruthy();
        expect(assistantCall[1].content).toContain('technical difficulties');
      });
      
      it('should maintain correlation IDs during errors', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockRejectedValue(new Error('Service error'));
        
        // Mock context assembly for empty results
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are an AI assistant for a Next.js + Convex development project.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });
        
        // Mock error response
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        
        // Verify correlation ID maintained in stored messages
        mockContext.runMutation.mock.calls.forEach(call => {
          expect(call[1].correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        });
      });
      
      it('should provide user-friendly error messages', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockRejectedValue(new Error('Complex technical error with stack trace'));
        
        // Mock context assembly for empty results
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are an AI assistant for a Next.js + Convex development project.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });
        
        // Mock user-friendly error response
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        // Should not expose technical error details to user
        expect(result.response).not.toContain('stack trace');
        expect(result.response).toContain('technical difficulties');
        expect(result.response).toContain('try again');
      });
    });

    describe('End-to-End RAG Workflow', () => {
      it('should complete full RAG query successfully', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [
            {
              id: 'vec-1',
              score: 0.92,
              chunk: {
                content: 'Comprehensive guide to Next.js development',
                source_document: 'docs/nextjs-guide.md',
                chunk_index: 0,
                metadata: { section: 'getting-started', type: 'documentation' },
              },
            },
            {
              id: 'vec-2',
              score: 0.84,
              chunk: {
                content: 'Convex integration patterns for Next.js applications',
                source_document: 'docs/convex-integration.md',
                chunk_index: 1,
                metadata: { section: 'backend', type: 'guide' },
              },
            },
          ],
          queryStats: { totalResults: 2, processingTimeMs: 150 },
        });
        
        // Mock successful context assembly
        mockAssembleContext.mockReturnValue({
          contextBlock: 'RELEVANT CONTEXT:\n\n--- Source: docs/nextjs-guide.md ---\nComprehensive guide to Next.js development\n\n--- Source: docs/convex-integration.md ---\nConvex integration patterns for Next.js applications',
          systemPrompt: 'You are an AI assistant with access to project documentation.',
          tokenEstimate: 300,
          chunksIncluded: 2,
          sources: ['docs/nextjs-guide.md', 'docs/convex-integration.md'],
        });
        
        mockStreamText.mockResolvedValue({
          textStream: (async function* () {
            yield 'Based on the documentation, ';
            yield 'Next.js with Convex provides ';
            yield 'excellent full-stack development capabilities.';
          })(),
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'How do I integrate Next.js with Convex?',
        });

        // Verify complete workflow
        expect(result.response).toBe('Based on the documentation, Next.js with Convex provides excellent full-stack development capabilities.');
        expect(result.sources).toHaveLength(2);
        expect(result.sources[0]).toEqual({
          source_document: 'docs/nextjs-guide.md',
          chunk_index: 0,
          relevance_score: 0.92,
        });
        expect(result.correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      });
      
      it('should return proper response structure', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: false });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        // Reset context assembly to not throw error
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are a helpful assistant.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result).toEqual({
          response: expect.any(String),
          sources: expect.any(Array),
          processingTimeMs: expect.any(Number),
          correlationId: expect.any(String),
        });
        
        expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      });
      
      it('should include sources, correlationId, and processingStats', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [{
            id: 'vec-1',
            score: 0.88,
            chunk: {
              content: 'Test documentation content',
              source_document: 'docs/test.md',
              chunk_index: 2,
              metadata: {},
            },
          }],
          queryStats: { totalResults: 1, processingTimeMs: 100 },
        });
        
        // Mock context assembly for successful case
        mockAssembleContext.mockReturnValue({
          contextBlock: 'RELEVANT CONTEXT:\n\n--- Source: docs/test.md ---\nTest documentation content',
          systemPrompt: 'You are an AI assistant with access to project documentation.',
          tokenEstimate: 150,
          chunksIncluded: 1,
          sources: ['docs/test.md'],
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.sources).toEqual([
          {
            source_document: 'docs/test.md',
            chunk_index: 2,
            relevance_score: 0.88,
          },
        ]);
        expect(result.correlationId).toBe('12345678-1234-4567-8901-123456789abc');
        expect(typeof result.processingTimeMs).toBe('number');
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      });
      
      it('should handle complex queries requiring multiple chunks', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: true });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        // Mock multiple relevant chunks
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [
            {
              id: 'vec-1',
              score: 0.91,
              chunk: {
                content: 'Authentication setup with BetterAuth',
                source_document: 'docs/auth.md',
                chunk_index: 0,
                metadata: {},
              },
            },
            {
              id: 'vec-2',
              score: 0.87,
              chunk: {
                content: 'Database schema for user management',
                source_document: 'docs/database.md',
                chunk_index: 1,
                metadata: {},
              },
            },
            {
              id: 'vec-3',
              score: 0.83,
              chunk: {
                content: 'Frontend authentication components',
                source_document: 'docs/components.md',
                chunk_index: 0,
                metadata: {},
              },
            },
            {
              id: 'vec-4',
              score: 0.79,
              chunk: {
                content: 'Security best practices',
                source_document: 'docs/security.md',
                chunk_index: 2,
                metadata: {},
              },
            },
            {
              id: 'vec-5',
              score: 0.75,
              chunk: {
                content: 'Testing authentication flows',
                source_document: 'docs/testing.md',
                chunk_index: 1,
                metadata: {},
              },
            },
          ],
          queryStats: { totalResults: 5, processingTimeMs: 200 },
        });
        
        // Mock successful context assembly with multiple sources
        mockAssembleContext.mockReturnValue({
          contextBlock: 'RELEVANT CONTEXT:\n\nMulti-source authentication context',
          systemPrompt: 'You are an AI assistant with access to project documentation.',
          tokenEstimate: 800,
          chunksIncluded: 5,
          sources: ['docs/auth.md', 'docs/database.md', 'docs/components.md', 'docs/security.md', 'docs/testing.md'],
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'How do I implement user authentication with security best practices?',
        });

        expect(result.sources).toHaveLength(5);
        expect(result.sources.map(s => s.source_document)).toEqual([
          'docs/auth.md',
          'docs/database.md',
          'docs/components.md',
          'docs/security.md',
          'docs/testing.md',
        ]);
        
        // Verify context assembly received all chunks above threshold
        expect(mockAssembleContext).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ source: 'docs/auth.md', score: 0.91 }),
            expect.objectContaining({ source: 'docs/database.md', score: 0.87 }),
            expect.objectContaining({ source: 'docs/components.md', score: 0.83 }),
            expect.objectContaining({ source: 'docs/security.md', score: 0.79 }),
            expect.objectContaining({ source: 'docs/testing.md', score: 0.75 }),
          ]),
          4000,
          true
        );
      });
      
      it('should handle user without LLM access gracefully', async () => {
        mockContext.auth.getUserIdentity.mockResolvedValue({ subject: 'user-123' });
        mockContext.runQuery.mockResolvedValue({ _id: 'user-123', hasLLMAccess: false });
        mockContext.runMutation.mockResolvedValue('message-id');
        
        
        // Mock vector search to return empty results (no sources for this test)
        mockQueryVectorSimilarityHandler.mockResolvedValue({
          matches: [],
          queryStats: { totalResults: 0, processingTimeMs: 50 },
        });
        // Reset context assembly to not throw error for no-access user
        mockAssembleContext.mockReturnValue({
          contextBlock: '',
          systemPrompt: 'You are a helpful assistant.',
          tokenEstimate: 0,
          chunksIncluded: 0,
          sources: [],
        });

        const result = await runRAGQueryHandler(mockContext, {
          sessionId: 'test-session',
          message: 'test query',
        });

        expect(result.response).toContain("I'd be happy to help, but I need access");
        expect(result.sources).toEqual([]);
        expect(result.correlationId).toBeDefined();
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
        
        // Should still store messages
        expect(mockContext.runMutation).toHaveBeenCalledTimes(2); // User + assistant messages
      });
    });
  });
});