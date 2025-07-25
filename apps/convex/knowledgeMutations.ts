import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * Simple unique ID generation for V8 runtime (without crypto dependency)
 */
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Internal mutation to create or update source document record
 */
export const createOrUpdateDocument = internalMutation({
  args: {
    filePath: v.string(),
    fileType: v.string(),
    contentHash: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('source_documents')
      .withIndex('by_file_path', (q) => q.eq('file_path', args.filePath))
      .first();

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, {
        content_hash: args.contentHash,
        last_processed: Date.now(),
        processing_status: 'processing',
        correlation_id: args.correlationId,
      });
      return existing._id;
    } else {
      // Create new document
      return await ctx.db.insert('source_documents', {
        file_path: args.filePath,
        file_type: args.fileType,
        content_hash: args.contentHash,
        last_processed: Date.now(),
        chunk_count: 0,
        processing_status: 'processing',
        correlation_id: args.correlationId,
      });
    }
  },
});

/**
 * Internal mutation to create document chunk record
 */
export const createDocumentChunk = internalMutation({
  args: {
    sourceDocument: v.string(),
    chunkIndex: v.number(),
    content: v.string(),
    chunkHash: v.string(),
    vectorizeId: v.string(),
    metadata: v.object({
      file_path: v.string(),
      file_type: v.string(),
      modified_at: v.number(),
      chunk_size: v.number(),
    }),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('document_chunks', {
      source_document: args.sourceDocument,
      chunk_index: args.chunkIndex,
      content: args.content,
      chunk_hash: args.chunkHash,
      vectorize_id: args.vectorizeId,
      metadata: args.metadata,
      created_at: Date.now(),
      correlation_id: args.correlationId,
    });
  },
});

/**
 * Internal mutation to update document processing status
 */
export const updateDocumentStatus = internalMutation({
  args: {
    documentId: v.id('source_documents'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    chunkCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      processing_status: 'pending' | 'processing' | 'completed' | 'failed';
      last_processed: number;
      chunk_count?: number;
      error_message?: string;
    } = {
      processing_status: args.status,
      last_processed: Date.now(),
    };

    if (args.chunkCount !== undefined) {
      updateData.chunk_count = args.chunkCount;
    }

    if (args.errorMessage) {
      updateData.error_message = args.errorMessage;
    }

    await ctx.db.patch(args.documentId, updateData);
  },
});

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