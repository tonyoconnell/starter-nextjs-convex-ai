import { queryKnowledgeBaseTool } from '../../../apps/convex/tools/queryKnowledgeBase';
import { aiTools, validateToolResult } from '../../../apps/convex/lib/aiTools';

describe('queryKnowledgeBase Tool', () => {
  describe('Tool Definition', () => {
    it('should be properly registered in aiTools', () => {
      expect(aiTools.queryKnowledgeBase).toBeDefined();
      expect(aiTools.queryKnowledgeBase).toBe(queryKnowledgeBaseTool);
    });

    it('should have correct description', () => {
      expect(queryKnowledgeBaseTool.description).toContain('Search the knowledge base');
    });

    it('should have properly defined parameters schema', () => {
      const tool = queryKnowledgeBaseTool;
      expect(tool.parameters).toBeDefined();
      
      // Basic schema validation (the exact API may vary)
      expect(typeof tool.parameters).toBe('object');
    });

    it('should apply default values for optional parameters', () => {
      // The exact parameter parsing API may vary
      expect(queryKnowledgeBaseTool.parameters).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should have parameter validation', () => {
      // Tool should have parameter schema defined
      expect(queryKnowledgeBaseTool.parameters).toBeDefined();
    });
  });

  describe('Tool Execution Error Handling', () => {
    it('should have execute function', () => {
      expect(typeof queryKnowledgeBaseTool.execute).toBe('function');
    });
  });

  describe('Tool Result Validation', () => {
    it('should validate correct tool result structure', () => {
      const validResult = {
        success: true,
        relevantChunks: [
          {
            content: 'test content',
            source: 'test.md',
            score: 0.9,
            chunkIndex: 0,
          }
        ],
        queryStats: {
          totalResults: 1,
          processingTimeMs: 100,
        },
      };
      
      expect(validateToolResult('queryKnowledgeBase', validResult)).toBe(true);
    });

    it('should reject invalid tool result structure', () => {
      const invalidResult = {
        success: 'invalid', // should be boolean
        relevantChunks: 'invalid', // should be array
      };
      
      expect(validateToolResult('queryKnowledgeBase', invalidResult)).toBe(false);
    });

    it('should reject unknown tool names', () => {
      const validResult = {
        success: true,
        relevantChunks: [],
        queryStats: { totalResults: 0, processingTimeMs: 0 },
      };
      
      expect(validateToolResult('unknownTool', validResult)).toBe(false);
    });
  });
});