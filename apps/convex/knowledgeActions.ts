"use node";

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import { ConvexError } from 'convex/values';
import crypto from 'crypto';
import { 
  chunkText, 
  generateEmbeddingsForChunks, 
  DEFAULT_CHUNKING_CONFIG,
  calculateTextStats,
  TextChunk
} from './lib/textProcessing';
import { getConfig } from './lib/config';

/**
 * Knowledge ingestion action for processing documents and creating vector embeddings
 * Follows AC 1 & 2: Create Convex action that takes text content as input
 */
export const addDocument = action({
  args: {
    content: v.string(),
    source: v.string(),
    metadata: v.optional(v.object({
      file_path: v.string(),
      file_type: v.string(),
      modified_at: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<{
    documentId: string;
    chunksCreated: number;
    status: string;
  }> => {
    try {
      // Generate correlation ID for tracing
      const correlationId = crypto.randomUUID();
      
      // Validate input content
      if (!args.content || args.content.trim().length === 0) {
        throw new ConvexError('Content cannot be empty');
      }
      
      if (!args.source || args.source.trim().length === 0) {
        throw new ConvexError('Source cannot be empty');
      }

      // Create content hash for deduplication
      const contentHash = crypto
        .createHash('sha256')
        .update(args.content)
        .digest('hex');

      // Check if document already exists and is up to date
      const existingDoc: {
        _id: string;
        content_hash: string;
        chunk_count: number;
      } | null = await ctx.runQuery(api.knowledgeMutations.getDocumentByPath, {
        filePath: args.source,
      });

      if (existingDoc && existingDoc.content_hash === contentHash) {
        // eslint-disable-next-line no-console
        console.log(`Document ${args.source} already exists with same content hash`);
        return {
          documentId: existingDoc._id,
          chunksCreated: existingDoc.chunk_count,
          status: 'already_exists',
        };
      }

      // Create or update source document record
      const documentId = await ctx.runMutation(internal.knowledgeMutations.createOrUpdateDocument, {
        filePath: args.source,
        fileType: args.metadata?.file_type || 'unknown',
        contentHash,
        correlationId,
      });

      // Task 2 & 7: Text chunking and embedding generation with environment config
      // eslint-disable-next-line no-console
      console.log(`Processing document ${args.source}: ${calculateTextStats(args.content).wordCount} words`);
      
      // Load configuration
      const config = getConfig();
      
      // Chunk the text for optimal embedding generation
      const textChunks = chunkText(args.content, DEFAULT_CHUNKING_CONFIG);
      // eslint-disable-next-line no-console
      console.log(`Created ${textChunks.length} chunks for document ${args.source}`);

      // Generate embeddings if OpenAI API key is available
      let chunksWithEmbeddings: Array<{ chunk: TextChunk; embedding: number[] | null }>;
      
      if (config.llm.openAiApiKey) {
        try {
          // eslint-disable-next-line no-console
          console.log(`Generating embeddings for ${textChunks.length} chunks...`);
          const embeddingResults = await generateEmbeddingsForChunks(
            textChunks,
            config.llm.openAiApiKey
          );
          chunksWithEmbeddings = embeddingResults;
          // eslint-disable-next-line no-console
          console.log(`Successfully generated embeddings for all chunks`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to generate embeddings:', error);
          // Fallback to placeholder embeddings
          chunksWithEmbeddings = textChunks.map(chunk => ({
            chunk,
            embedding: null,
          }));
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('OpenAI API key not configured - skipping embedding generation');
        chunksWithEmbeddings = textChunks.map(chunk => ({
          chunk,
          embedding: null,
        }));
      }

      let chunksCreated = 0;
      for (const chunkWithEmbedding of chunksWithEmbeddings) {
        const { chunk } = chunkWithEmbedding;
        
        // Create chunk hash for deduplication
        const chunkHash = crypto
          .createHash('sha256')
          .update(`${args.source}:${chunk.index}:${chunk.content}`)
          .digest('hex');

        // TODO: Task 3 - Vectorize integration will be implemented here
        // For now, use placeholder vectorize ID
        const vectorizeId = `placeholder_${chunkHash}`;

        // Store chunk metadata in Convex
        await ctx.runMutation(internal.knowledgeMutations.createDocumentChunk, {
          sourceDocument: args.source,
          chunkIndex: chunk.index,
          content: chunk.content,
          chunkHash,
          vectorizeId,
          metadata: {
            file_path: args.source,
            file_type: args.metadata?.file_type || 'unknown',
            modified_at: args.metadata?.modified_at || Date.now(),
            chunk_size: chunk.content.length,
          },
          correlationId,
        });

        chunksCreated++;
      }

      // Update document processing status
      await ctx.runMutation(internal.knowledgeMutations.updateDocumentStatus, {
        documentId,
        status: 'completed',
        chunkCount: chunksCreated,
      });

      // eslint-disable-next-line no-console
      console.log(`Successfully processed document ${args.source}: ${chunksCreated} chunks created`);

      return {
        documentId,
        chunksCreated,
        status: 'completed',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing document:', error);
      throw new ConvexError(`Failed to process document: ${(error as Error).message}`);
    }
  },
});