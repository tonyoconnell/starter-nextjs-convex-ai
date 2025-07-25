import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Query to get document by file path
 */
export const getDocumentByPath = query({
  args: { filePath: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('source_documents')
      .withIndex('by_file_path', (q) => q.eq('file_path', args.filePath))
      .first();
  },
});

/**
 * Query to get all documents with pagination
 */
export const getDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query('source_documents')
      .order('desc')
      .take(limit);
  },
});

/**
 * Query to get document chunks by source document
 */
export const getDocumentChunks = query({
  args: { 
    sourceDocument: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query('document_chunks')
      .withIndex('by_source_document', (q) => q.eq('source_document', args.sourceDocument))
      .order('asc')
      .take(limit);
  },
});