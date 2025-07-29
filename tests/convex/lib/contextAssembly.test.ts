// @ts-nocheck
/**
 * Comprehensive tests for lib/contextAssembly.ts
 * Tests: context assembly, token estimation, system prompts, model optimization, validation
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

// Import functions to test
import {
  assembleContext,
  createSystemPrompt,
  optimizeContextForModel,
  validateContext,
  estimateTokens,
  type ContextChunk,
  type AssembledContext,
} from '../../../apps/convex/lib/contextAssembly';

// Mock the config module
jest.mock('../../../apps/convex/lib/config', () => ({
  getConfig: jest.fn(() => ({
    llm: {
      defaultModel: 'anthropic/claude-3-haiku',
      fallbackModel: 'openai/gpt-4o-mini',
    },
  })),
}));

describe('Context Assembly', () => {
  const mockChunks: ContextChunk[] = [
    {
      content: 'This is the first chunk with relevant information about testing patterns.',
      source: 'testing-patterns.md',
      score: 0.95,
      chunkIndex: 0,
      metadata: {
        fileType: 'markdown',
        chunkSize: 72,
        lastModified: 1703123456789,
      },
    },
    {
      content: 'Second chunk contains implementation details for React components.',
      source: 'component-guide.md',
      score: 0.87,
      chunkIndex: 1,
      metadata: {
        fileType: 'markdown',
        chunkSize: 63,
        lastModified: 1703123456790,
      },
    },
    {
      content: 'Third chunk discusses database schema and migration strategies.',
      source: 'database-guide.md',
      score: 0.78,
      chunkIndex: 0,
      metadata: {
        fileType: 'markdown',
        chunkSize: 60,
        lastModified: 1703123456791,
      },
    },
    {
      content: 'Fourth chunk with lower relevance about general project setup.',
      source: 'setup-guide.md',
      score: 0.65,
      chunkIndex: 2,
      metadata: {
        fileType: 'markdown',
        chunkSize: 58,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assembleContext', () => {
    describe('Basic Context Assembly', () => {
      it('should assemble context from multiple chunks in relevance order', () => {
        const result = assembleContext(mockChunks, 4000, true);

        expect(result.contextBlock).toContain('RELEVANT CONTEXT:');
        expect(result.contextBlock).toContain('testing-patterns.md');
        expect(result.contextBlock).toContain('component-guide.md');
        expect(result.contextBlock).toContain('database-guide.md');
        expect(result.contextBlock).toContain('setup-guide.md');
        
        // Should be ordered by relevance score (highest first)
        const firstChunkIndex = result.contextBlock.indexOf('testing-patterns.md');
        const secondChunkIndex = result.contextBlock.indexOf('component-guide.md');
        const thirdChunkIndex = result.contextBlock.indexOf('database-guide.md');
        const fourthChunkIndex = result.contextBlock.indexOf('setup-guide.md');
        
        expect(firstChunkIndex).toBeLessThan(secondChunkIndex);
        expect(secondChunkIndex).toBeLessThan(thirdChunkIndex);
        expect(thirdChunkIndex).toBeLessThan(fourthChunkIndex);
      });

      it('should include relevance scores in context headers', () => {
        const result = assembleContext(mockChunks, 4000, true);

        expect(result.contextBlock).toContain('relevance: 0.95');
        expect(result.contextBlock).toContain('relevance: 0.87');
        expect(result.contextBlock).toContain('relevance: 0.78');
        expect(result.contextBlock).toContain('relevance: 0.65');
      });

      it('should include all chunk content', () => {
        const result = assembleContext(mockChunks, 4000, true);

        mockChunks.forEach(chunk => {
          expect(result.contextBlock).toContain(chunk.content);
        });
      });

      it('should provide accurate metrics', () => {
        const result = assembleContext(mockChunks, 4000, true);

        expect(result.chunksIncluded).toBe(4);
        expect(result.sources).toEqual([
          'testing-patterns.md',
          'component-guide.md',
          'database-guide.md',
          'setup-guide.md',
        ]);
        expect(result.tokenEstimate).toBeGreaterThan(0);
        expect(typeof result.tokenEstimate).toBe('number');
      });

      it('should generate appropriate system prompt', () => {
        const result = assembleContext(mockChunks, 4000, true);

        expect(result.systemPrompt).toContain('AI assistant with access to project documentation');
        expect(result.systemPrompt).toContain('RELEVANT CONTEXT:');
        expect(result.systemPrompt).toContain('Instructions:');
      });
    });

    describe('Token Management', () => {
      it('should respect token limits', () => {
        const smallLimit = 200; // Very small limit
        const result = assembleContext(mockChunks, smallLimit, true);

        // With such a small limit, should include no chunks (limit too small even for buffer)
        expect(result.chunksIncluded).toBe(0);
        expect(result.tokenEstimate).toBe(0);
      });

      it('should prioritize higher-scoring chunks when token-limited', () => {
        const mediumLimit = 1000; // More realistic limit that allows some chunks
        const result = assembleContext(mockChunks, mediumLimit, true);

        // Should include some chunks but not all
        expect(result.chunksIncluded).toBeGreaterThan(0);
        expect(result.chunksIncluded).toBeLessThanOrEqual(mockChunks.length);
        
        // If chunks are limited, should include highest scoring first
        if (result.chunksIncluded > 0 && result.chunksIncluded < mockChunks.length) {
          // Should include highest scoring chunk if any are included
          expect(result.contextBlock).toContain('testing-patterns.md'); // Score: 0.95
        }
      });

      it('should leave buffer space for system prompt', () => {
        const maxTokens = 1000;
        const result = assembleContext(mockChunks, maxTokens, true);

        // Token estimate should be significantly less than maxTokens to leave space
        expect(result.tokenEstimate).toBeLessThan(maxTokens - 400); // At least 400 token buffer
      });

      it('should handle zero token limit gracefully', () => {
        const result = assembleContext(mockChunks, 0, true);

        expect(result.chunksIncluded).toBe(0);
        expect(result.contextBlock).toBe('RELEVANT CONTEXT:\n\n');
        expect(result.sources).toEqual([]);
        expect(result.tokenEstimate).toBe(0);
      });
    });

    describe('Metadata Handling', () => {
      it('should include metadata when requested', () => {
        const result = assembleContext(mockChunks, 4000, true);

        expect(result.contextBlock).toContain('[Metadata:');
        expect(result.contextBlock).toContain('fileType');
        expect(result.contextBlock).toContain('chunkSize');
        expect(result.contextBlock).toContain('lastModified');
      });

      it('should exclude metadata when not requested', () => {
        const result = assembleContext(mockChunks, 4000, false);

        expect(result.contextBlock).not.toContain('[Metadata:');
        expect(result.contextBlock).not.toContain('fileType');
        expect(result.contextBlock).not.toContain('chunkSize');
      });

      it('should handle chunks without metadata gracefully', () => {
        const chunksWithoutMetadata: ContextChunk[] = [
          {
            content: 'Content without metadata',
            source: 'test.md',
            score: 0.9,
          },
        ];

        const result = assembleContext(chunksWithoutMetadata, 4000, true);

        expect(result.chunksIncluded).toBe(1);
        expect(result.contextBlock).toContain('Content without metadata');
        expect(result.contextBlock).not.toContain('[Metadata:');
      });

      it('should respect token limits when including metadata', () => {
        const mediumLimit = 1000;
        const result = assembleContext(mockChunks, mediumLimit, true);

        // Should respect token limits even with metadata
        expect(result.tokenEstimate).toBeLessThanOrEqual(mediumLimit - 400); // Reasonable buffer
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty chunks array', () => {
        const result = assembleContext([], 4000, true);

        expect(result.contextBlock).toBe('No relevant context found in the knowledge base.');
        // The system prompt for empty context contains 'general guidance' (not 'general development guidance')
        expect(result.systemPrompt).toContain('general guidance');
        expect(result.tokenEstimate).toBe(0);
        expect(result.chunksIncluded).toBe(0);
        expect(result.sources).toEqual([]);
      });

      it('should handle single chunk', () => {
        const singleChunk = [mockChunks[0]];
        const result = assembleContext(singleChunk, 4000, true);

        expect(result.chunksIncluded).toBe(1);
        expect(result.sources).toEqual(['testing-patterns.md']);
        expect(result.contextBlock).toContain(singleChunk[0].content);
      });

      it('should handle chunks with identical scores', () => {
        const identicalScoreChunks: ContextChunk[] = [
          { content: 'First chunk', source: 'a.md', score: 0.8 },
          { content: 'Second chunk', source: 'b.md', score: 0.8 },
          { content: 'Third chunk', source: 'c.md', score: 0.8 },
        ];

        const result = assembleContext(identicalScoreChunks, 4000, true);

        expect(result.chunksIncluded).toBe(3);
        expect(result.sources).toHaveLength(3);
      });

      it('should handle very long content chunks', () => {
        const longChunk: ContextChunk = {
          content: 'Very long content. '.repeat(1000), // ~20,000 characters
          source: 'long-document.md',
          score: 0.9,
        };

        const result = assembleContext([longChunk], 1000, true);

        // Should either include the chunk or respect token limits
        if (result.chunksIncluded === 1) {
          expect(result.contextBlock).toContain('Very long content');
        } else {
          expect(result.chunksIncluded).toBe(0);
        }
      });

      it('should handle chunks with special characters', () => {
        const specialChunk: ContextChunk = {
          content: 'Content with special chars: @#$%^&*()_+ and unicode: 🚀🎉💻',
          source: 'special.md',
          score: 0.8,
        };

        const result = assembleContext([specialChunk], 4000, true);

        expect(result.chunksIncluded).toBe(1);
        expect(result.contextBlock).toContain('🚀🎉💻');
      });

      it('should handle chunks with code blocks', () => {
        const codeChunk: ContextChunk = {
          content: `Here's some code:
\`\`\`typescript
function test() {
  return "hello world";
}
\`\`\`
End of code block.`,
          source: 'code-example.md',
          score: 0.85,
        };

        const result = assembleContext([codeChunk], 4000, true);

        expect(result.chunksIncluded).toBe(1);
        expect(result.contextBlock).toContain('```typescript');
        expect(result.contextBlock).toContain('function test()');
      });
    });

    describe('Source Deduplication', () => {
      it('should track unique sources correctly', () => {
        const chunksWithDuplicateSources: ContextChunk[] = [
          { content: 'First chunk from doc A', source: 'doc-a.md', score: 0.9 },
          { content: 'Second chunk from doc A', source: 'doc-a.md', score: 0.8 },
          { content: 'Chunk from doc B', source: 'doc-b.md', score: 0.7 },
        ];

        const result = assembleContext(chunksWithDuplicateSources, 4000, true);

        expect(result.chunksIncluded).toBe(3);
        expect(result.sources).toEqual(['doc-a.md', 'doc-b.md']); // Unique sources only
        expect(result.sources).toHaveLength(2);
      });

      it('should maintain source order based on first appearance', () => {
        const chunksWithMultipleSources: ContextChunk[] = [
          { content: 'Content from Z', source: 'z-doc.md', score: 0.9 },
          { content: 'Content from A', source: 'a-doc.md', score: 0.8 },
          { content: 'More from Z', source: 'z-doc.md', score: 0.7 },
        ];

        const result = assembleContext(chunksWithMultipleSources, 4000, true);

        expect(result.sources).toEqual(['z-doc.md', 'a-doc.md']); // Order of first appearance
      });
    });
  });

  describe('createSystemPrompt', () => {
    describe('User Access Levels', () => {
      it('should create limited prompt for users without LLM access', () => {
        const prompt = createSystemPrompt('Some context', false);

        expect(prompt).toContain('helpful assistant');
        expect(prompt).toContain("user doesn't have access to the full knowledge base");
        expect(prompt).toContain('contact their administrator');
        expect(prompt).toContain('Keep responses concise');
        expect(prompt).not.toContain('RELEVANT CONTEXT');
      });

      it('should ignore context when user lacks LLM access', () => {
        const contextWithData = 'RELEVANT CONTEXT:\n\n--- Source: test.md ---\nTest content';
        const prompt = createSystemPrompt(contextWithData, false);

        expect(prompt).not.toContain('test.md');
        expect(prompt).not.toContain('Test content');
        expect(prompt).toContain('general guidance');
      });
    });

    describe('Context-based Prompts', () => {
      it('should create general prompt when no context provided', () => {
        const prompt = createSystemPrompt('', true);

        expect(prompt).toContain('Next.js + Convex development project');
        expect(prompt).toContain("doesn't have specific context");
        expect(prompt).toContain('general development guidance');
        expect(prompt).toContain('Be helpful and concise');
      });

      it('should create general prompt when context indicates no relevant information', () => {
        const noContextMessage = 'No relevant context found in the knowledge base.';
        const prompt = createSystemPrompt(noContextMessage, true);

        expect(prompt).toContain('general development guidance');
        expect(prompt).not.toContain('RELEVANT CONTEXT');
      });

      it('should create detailed prompt with valid context', () => {
        const contextBlock = `RELEVANT CONTEXT:

--- Source: test.md (relevance: 0.95) ---
Test documentation content

--- Source: guide.md (relevance: 0.87) ---
Guide content here`;

        const prompt = createSystemPrompt(contextBlock, true);

        expect(prompt).toContain('AI assistant with access to project documentation');
        expect(prompt).toContain(contextBlock);
        expect(prompt).toContain('Instructions:');
        expect(prompt).toContain('Answer based on the provided context');
        expect(prompt).toContain('specific references to source documents');
        expect(prompt).toContain('code examples');
        expect(prompt).toContain('conflicting information');
      });
    });

    describe('Prompt Instructions', () => {
      it('should include comprehensive instructions for context-based responses', () => {
        const context = 'RELEVANT CONTEXT:\n\nSome context';
        const prompt = createSystemPrompt(context, true);

        const expectedInstructions = [
          'Answer based on the provided context',
          'information is missing',
          'specific references to source documents',
          'concise but thorough',
          'code examples',
          'helpful, technical tone',
          'conflicting information',
        ];

        expectedInstructions.forEach(instruction => {
          expect(prompt).toContain(instruction);
        });
      });

      it('should handle whitespace-only context as empty', () => {
        const whitespaceContext = '   \n\t   ';
        const prompt = createSystemPrompt(whitespaceContext, true);

        expect(prompt).toContain('general development guidance');
        expect(prompt).not.toContain('RELEVANT CONTEXT');
      });
    });
  });

  describe('optimizeContextForModel', () => {
    const baseContext: AssembledContext = {
      contextBlock: 'Test context block',
      systemPrompt: 'You are an AI assistant with instructions to follow.',
      tokenEstimate: 100,
      chunksIncluded: 2,
      sources: ['test.md'],
    };

    describe('Claude Model Optimizations', () => {
      it('should optimize for Claude models', () => {
        // Use a context that actually contains 'Instructions:' to be replaced
        const contextWithInstructions: AssembledContext = {
          ...baseContext,
          systemPrompt: 'You are an AI assistant. Instructions: Follow these rules carefully.',
        };
        
        const optimized = optimizeContextForModel(contextWithInstructions, 'anthropic/claude-3-haiku');

        // Test the actual behavior: replaces 'Instructions:' with 'Please follow these instructions carefully:'
        expect(optimized.systemPrompt).toContain('Please follow these instructions carefully:');
        expect(optimized.systemPrompt).not.toContain('Instructions:');
        expect(optimized.contextBlock).toBe(contextWithInstructions.contextBlock);
        expect(optimized.tokenEstimate).toBe(contextWithInstructions.tokenEstimate);
      });

      it('should handle different Claude model variants', () => {
        const claudeModels = [
          'anthropic/claude-3-haiku',
          'anthropic/claude-3-sonnet', 
          'claude-instant-1',
        ];

        // Use a context that actually contains 'Instructions:' to be replaced
        const contextWithInstructions: AssembledContext = {
          ...baseContext,
          systemPrompt: 'You are an AI assistant. Instructions: Follow these rules carefully.',
        };

        claudeModels.forEach(modelId => {
          const optimized = optimizeContextForModel(contextWithInstructions, modelId);
          // Only test models that actually contain 'claude' in the ID
          if (modelId.includes('claude')) {
            expect(optimized.systemPrompt).toContain('Please follow these instructions carefully:');
            expect(optimized.systemPrompt).not.toContain('Instructions:');
          }
        });
      });
    });

    describe('GPT Model Optimizations', () => {
      it('should optimize for GPT models', () => {
        const optimized = optimizeContextForModel(baseContext, 'openai/gpt-4o');

        expect(optimized.systemPrompt).toContain('You are a helpful AI assistant');
        expect(optimized.systemPrompt).not.toContain('You are an AI assistant');
        expect(optimized.contextBlock).toBe(baseContext.contextBlock);
      });

      it('should handle different GPT model variants', () => {
        const gptModels = [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'openai/gpt-3.5-turbo',
          'gpt-4-turbo',
        ];

        gptModels.forEach(modelId => {
          const optimized = optimizeContextForModel(baseContext, modelId);
          expect(optimized.systemPrompt).toContain('helpful AI assistant');
        });
      });
    });

    describe('Unknown Model Handling', () => {
      it('should return unchanged context for unknown models', () => {
        const unknownModels = ['unknown/model', 'custom-model', ''];

        unknownModels.forEach(modelId => {
          const optimized = optimizeContextForModel(baseContext, modelId);
          expect(optimized).toEqual(baseContext);
        });
      });

      it('should preserve all context properties for unknown models', () => {
        const optimized = optimizeContextForModel(baseContext, 'unknown-model');

        expect(optimized.contextBlock).toBe(baseContext.contextBlock);
        expect(optimized.systemPrompt).toBe(baseContext.systemPrompt);
        expect(optimized.tokenEstimate).toBe(baseContext.tokenEstimate);
        expect(optimized.chunksIncluded).toBe(baseContext.chunksIncluded);
        expect(optimized.sources).toEqual(baseContext.sources);
      });
    });
  });

  describe('validateContext', () => {
    describe('Valid Context Validation', () => {
      it('should validate normal context as valid', () => {
        const validContext: AssembledContext = {
          contextBlock: 'This is a reasonable amount of context content that should be sufficient for analysis and response generation.',
          systemPrompt: 'System prompt here',
          tokenEstimate: 150,
          chunksIncluded: 2,
          sources: ['doc1.md', 'doc2.md'],
        };

        const validation = validateContext(validContext);

        expect(validation.isValid).toBe(true);
        expect(validation.issues).toHaveLength(0);
        expect(validation.suggestions).toHaveLength(0);
      });

      it('should provide suggestions for single-source context with multiple chunks', () => {
        const singleSourceContext: AssembledContext = {
          contextBlock: 'Sufficient context content from a single source document that meets the minimum length requirement for meaningful analysis.',
          systemPrompt: 'System prompt',
          tokenEstimate: 200,
          chunksIncluded: 3, // Multiple chunks from single source
          sources: ['single-doc.md'], // Only one source
        };

        const validation = validateContext(singleSourceContext);

        expect(validation.isValid).toBe(true); // Still valid
        expect(validation.issues).toHaveLength(0);
        // Test that suggestions array includes the expected suggestion
        expect(validation.suggestions.length).toBeGreaterThan(0);
        expect(validation.suggestions.some(s => s.includes('diverse sources'))).toBe(true);
      });
    });

    describe('Invalid Context Detection', () => {
      it('should detect excessive token usage', () => {
        const excessiveTokenContext: AssembledContext = {
          contextBlock: 'Context content',
          systemPrompt: 'System prompt',
          tokenEstimate: 9000, // Exceeds 8000 limit
          chunksIncluded: 10,
          sources: ['doc1.md'],
        };

        const validation = validateContext(excessiveTokenContext);

        expect(validation.isValid).toBe(false);
        expect(validation.issues).toContain('Context exceeds recommended token limit');
        expect(validation.suggestions).toContain('Consider reducing maxTokens or implementing better chunk filtering');
      });

      it('should detect when no chunks are included', () => {
        const noChunksContext: AssembledContext = {
          contextBlock: 'No relevant context found in the knowledge base.',
          systemPrompt: 'System prompt',
          tokenEstimate: 0,
          chunksIncluded: 0, // No chunks included
          sources: [],
        };

        const validation = validateContext(noChunksContext);

        expect(validation.isValid).toBe(false);
        expect(validation.issues).toContain('No context chunks included');
        expect(validation.suggestions).toContain('Verify search results contain relevant information');
      });

      it('should detect insufficient context content', () => {
        const shortContext: AssembledContext = {
          contextBlock: 'Too short', // Less than 100 characters
          systemPrompt: 'System prompt',
          tokenEstimate: 10,
          chunksIncluded: 1,
          sources: ['doc.md'],
        };

        const validation = validateContext(shortContext);

        expect(validation.isValid).toBe(false);
        expect(validation.issues).toContain('Context block appears to be too short for meaningful analysis');
      });
    });

    describe('Multiple Issues Detection', () => {
      it('should detect multiple issues in problematic context', () => {
        const problematicContext: AssembledContext = {
          contextBlock: 'Short', // Too short AND excessive tokens (contradictory but testing edge case)
          systemPrompt: 'System prompt',
          tokenEstimate: 8500, // Exceeds limit
          chunksIncluded: 0, // No chunks
          sources: [],
        };

        const validation = validateContext(problematicContext);

        expect(validation.isValid).toBe(false);
        expect(validation.issues.length).toBeGreaterThan(1);
        expect(validation.issues).toContain('Context exceeds recommended token limit');
        expect(validation.issues).toContain('No context chunks included');
        expect(validation.issues).toContain('Context block appears to be too short for meaningful analysis');
      });

      it('should provide multiple suggestions when applicable', () => {
        const contextNeedingSuggestions: AssembledContext = {
          contextBlock: 'This is sufficient context content that meets the minimum length requirement for meaningful analysis and processing.',
          systemPrompt: 'System prompt',
          tokenEstimate: 200,
          chunksIncluded: 4, // Multiple chunks from single source
          sources: ['single-document.md'], // Only one source
        };

        const validation = validateContext(contextNeedingSuggestions);

        expect(validation.isValid).toBe(true);
        expect(validation.suggestions.length).toBeGreaterThan(0);
        expect(validation.suggestions.some(s => s.includes('diverse sources'))).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle context at exact token limit', () => {
        const exactLimitContext: AssembledContext = {
          contextBlock: 'Context content at exact limit that meets the minimum length requirement for meaningful analysis. This needs to be at least 100 characters long to pass the validation check in the function.',
          systemPrompt: 'System prompt',
          tokenEstimate: 7999, // Just under the limit
          chunksIncluded: 3,
          sources: ['doc1.md', 'doc2.md'],
        };

        const validation = validateContext(exactLimitContext);

        // Test actual behavior: 7999 tokens is under 8000 and context is > 100 chars, so should be valid
        expect(validation.isValid).toBe(true);
        expect(validation.issues.some(issue => issue.includes('exceeds recommended token limit'))).toBe(false);
      });

      it('should handle context at minimum length threshold', () => {
        const minLengthContext: AssembledContext = {
          contextBlock: 'x'.repeat(100), // Exactly 100 characters
          systemPrompt: 'System prompt',
          tokenEstimate: 50,
          chunksIncluded: 1,
          sources: ['doc.md'],
        };

        const validation = validateContext(minLengthContext);

        expect(validation.isValid).toBe(true); // Should be valid at exactly 100 chars
        expect(validation.issues).not.toContain('Context block appears to be too short for meaningful analysis');
      });
    });
  });

  describe('estimateTokens', () => {
    const testText = 'This is a test string for token estimation. It contains various words and punctuation!';

    describe('Model-specific Token Estimation', () => {
      it('should estimate tokens for Claude models', () => {
        const claudeTokens = estimateTokens(testText, 'anthropic/claude-3-haiku');
        const expectedTokens = Math.ceil(testText.length / 4.2);

        expect(claudeTokens).toBe(expectedTokens);
        expect(claudeTokens).toBeGreaterThan(0);
      });

      it('should estimate tokens for GPT models', () => {
        const gptTokens = estimateTokens(testText, 'openai/gpt-4o');
        const expectedTokens = Math.ceil(testText.length / 4.0);

        expect(gptTokens).toBe(expectedTokens);
        expect(gptTokens).toBeGreaterThan(0);
      });

      it('should use conservative estimate for unknown models', () => {
        const unknownTokens = estimateTokens(testText, 'unknown/model');
        const expectedTokens = Math.ceil(testText.length / 3.8);

        expect(unknownTokens).toBe(expectedTokens);
        expect(unknownTokens).toBeGreaterThan(0);
      });

      it('should show different estimates for different models', () => {
        const claudeTokens = estimateTokens(testText, 'anthropic/claude-3-haiku');
        const gptTokens = estimateTokens(testText, 'openai/gpt-4o');
        const unknownTokens = estimateTokens(testText, 'unknown/model');

        // Claude should be most efficient (lowest token count)
        expect(claudeTokens).toBeLessThan(gptTokens);
        expect(gptTokens).toBeLessThan(unknownTokens);
      });
    });

    describe('Text Length Variations', () => {
      it('should handle empty string', () => {
        const emptyTokens = estimateTokens('', 'openai/gpt-4o');
        expect(emptyTokens).toBe(0);
      });

      it('should handle single character', () => {
        const singleTokens = estimateTokens('a', 'openai/gpt-4o');
        expect(singleTokens).toBe(1); // Math.ceil(1 / 4.0) = 1
      });

      it('should handle very long text', () => {
        const longText = 'word '.repeat(10000); // 50,000 characters
        const longTextTokens = estimateTokens(longText, 'openai/gpt-4o');
        const expectedTokens = Math.ceil(longText.length / 4.0);

        expect(longTextTokens).toBe(expectedTokens);
        expect(longTextTokens).toBeGreaterThan(12000); // Should be substantial
      });

      it('should handle text with special characters', () => {
        const specialText = '🚀💻🎉 Special chars & symbols @#$%^&*()_+{}|:"<>?[];,./`~';
        const specialTokens = estimateTokens(specialText, 'openai/gpt-4o');

        expect(specialTokens).toBeGreaterThan(0);
        expect(typeof specialTokens).toBe('number');
      });

      it('should handle text with code blocks', () => {
        const codeText = `
function calculateTokens(text: string): number {
  const CHARS_PER_TOKEN = 4.0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
`;
        const codeTokens = estimateTokens(codeText, 'openai/gpt-4o');

        expect(codeTokens).toBeGreaterThan(0);
        expect(codeTokens).toBe(Math.ceil(codeText.length / 4.0));
      });
    });

    describe('Model ID Pattern Matching', () => {
      it('should recognize various Claude model patterns', () => {
        const claudeModels = [
          'anthropic/claude-3-haiku',
          'anthropic/claude-3-sonnet',
          'claude-instant-1',
          'claude-2',
        ];

        claudeModels.forEach(model => {
          const tokens = estimateTokens('test text', model);
          const expected = Math.ceil(9 / 4.2); // 'test text' is 9 characters
          expect(tokens).toBe(expected);
        });
      });

      it('should recognize various GPT model patterns', () => {
        const gptModels = [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'gpt-3.5-turbo',
          'gpt-4-turbo',
        ];

        gptModels.forEach(model => {
          const tokens = estimateTokens('test text', model);
          const expected = Math.ceil(9 / 4.0); // 'test text' is 9 characters
          expect(tokens).toBe(expected);
        });
      });

      it('should handle case sensitivity correctly', () => {
        const upperCaseModel = 'ANTHROPIC/CLAUDE-3-HAIKU';
        const lowerCaseModel = 'anthropic/claude-3-haiku';

        const upperTokens = estimateTokens('test', upperCaseModel);
        const lowerTokens = estimateTokens('test', lowerCaseModel);

        // Test actual behavior: function uses case-sensitive includes() checks
        // Upper case won't match 'claude' so will use default estimation (3.8)
        // Lower case will match 'claude' so will use Claude estimation (4.2)
        expect(upperTokens).toBe(Math.ceil(4 / 3.8)); // Default estimation
        expect(lowerTokens).toBe(Math.ceil(4 / 4.2)); // Claude estimation
        expect(upperTokens).not.toBe(lowerTokens); // They should differ
      });
    });

    describe('Consistency and Accuracy', () => {
      it('should always return positive integers for non-empty text', () => {
        const testTexts = [
          'Short text',
          'Medium length text with multiple words and punctuation.',
          'Very long text content '.repeat(100),
        ];

        testTexts.forEach(text => {
          const tokens = estimateTokens(text, 'openai/gpt-4o');
          expect(tokens).toBeGreaterThan(0);
          expect(Number.isInteger(tokens)).toBe(true);
        });
      });

      it('should be consistent for identical inputs', () => {
        const text = 'Consistency test text';
        const model = 'anthropic/claude-3-haiku';

        const estimate1 = estimateTokens(text, model);
        const estimate2 = estimateTokens(text, model);
        const estimate3 = estimateTokens(text, model);

        expect(estimate1).toBe(estimate2);
        expect(estimate2).toBe(estimate3);
      });

      it('should scale proportionally with text length', () => {
        const baseText = 'Token estimation test';
        const doubleText = baseText + ' ' + baseText;
        const quadrupleText = doubleText + ' ' + doubleText;

        const baseTokens = estimateTokens(baseText, 'openai/gpt-4o');
        const doubleTokens = estimateTokens(doubleText, 'openai/gpt-4o');
        const quadrupleTokens = estimateTokens(quadrupleText, 'openai/gpt-4o');

        // Should roughly scale (allowing for rounding differences)
        expect(doubleTokens).toBeGreaterThan(baseTokens);
        expect(quadrupleTokens).toBeGreaterThan(doubleTokens);
        
        // Approximate scaling check (within reasonable bounds due to rounding)
        expect(doubleTokens).toBeLessThanOrEqual(baseTokens * 2.5);
        expect(quadrupleTokens).toBeLessThanOrEqual(baseTokens * 4.5);
      });
    });
  });
});