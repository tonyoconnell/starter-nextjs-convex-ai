"use node";

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';
import { getConfig } from './lib/config';
import crypto from 'crypto';

/**
 * OpenRouter LLM integration for generating AI responses
 * Implements AC 6: OpenRouter API integration for actual LLM responses
 */
export const generateResponse = action({
  args: {
    sessionId: v.id('chat_sessions'),
    message: v.string(),
    userId: v.id('users'),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = crypto.randomUUID();
    
    try {
      // Check user's LLM access
      const accessCheck = await ctx.runQuery(api.auth.checkUserLLMAccess, {
        userId: args.userId,
      });

      if (!accessCheck.hasLLMAccess) {
        // Log access denial
        await ctx.runMutation(api.auth.logAccessEvent, {
          userId: args.userId,
          eventType: 'access_denied',
          details: 'LLM access requested but user lacks permission',
        });

        // Return fallback response
        const fallbackResponse = generateFallbackResponse(args.message);
        
        // Store message in database
        await ctx.runMutation(api.agent.createChatMessage, {
          sessionId: args.sessionId,
          userId: args.userId,
          role: 'assistant',
          content: fallbackResponse,
          correlationId,
          hasLLMAccess: false,
        });

        return {
          response: fallbackResponse,
          model: 'fallback',
          tokensUsed: 0,
          hasLLMAccess: false,
          fallbackMessage: accessCheck.fallbackMessage,
        };
      }

      // User has LLM access - proceed with AI generation
      await ctx.runMutation(api.auth.logAccessEvent, {
        userId: args.userId,
        eventType: 'access_granted',
        details: 'LLM access granted for message generation',
      });

      // Load configuration
      const config = getConfig();
      
      // Select model (use provided model or default)
      const selectedModel = args.model || config.llm.defaultModel;
      
      // eslint-disable-next-line no-console
      console.log(`Generating response with model: ${selectedModel} (correlation: ${correlationId})`);

      // Call OpenRouter API
      const response = await callOpenRouterAPI(
        args.message,
        config.llm.openRouterApiKey,
        selectedModel,
        config.llm.fallbackModel
      );

      // Store response in database
      await ctx.runMutation(api.agent.createChatMessage, {
        sessionId: args.sessionId,
        userId: args.userId,
        role: 'assistant',
        content: response.content,
        correlationId,
        modelUsed: response.model,
        tokensUsed: response.tokensUsed,
        hasLLMAccess: true,
      });

      return {
        response: response.content,
        model: response.model,
        tokensUsed: response.tokensUsed,
        hasLLMAccess: true,
        fallbackMessage: null,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error generating response (correlation: ${correlationId}):`, error);
      
      // In case of error, return fallback response
      const fallbackResponse = 'I apologize, but I encountered an issue processing your request. Please try again.';
      
      await ctx.runMutation(api.agent.createChatMessage, {
        sessionId: args.sessionId,
        userId: args.userId,
        role: 'assistant',
        content: fallbackResponse,
        correlationId,
        hasLLMAccess: false,
      });

      return {
        response: fallbackResponse,
        model: 'error_fallback',
        tokensUsed: 0,
        hasLLMAccess: false,
        fallbackMessage: 'An error occurred while processing your request.',
      };
    }
  },
});

/**
 * Call OpenRouter API with retry logic and fallback
 */
async function callOpenRouterAPI(
  message: string,
  apiKey: string,
  primaryModel: string,
  fallbackModel: string,
  maxRetries: number = 2
): Promise<{ content: string; model: string; tokensUsed: number }> {
  const models = [primaryModel, fallbackModel];
  
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Starter NextJS Convex AI',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.',
              },
              {
                role: 'user',
                content: message,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response choices returned from OpenRouter API');
        }

        const content = data.choices[0].message?.content;
        if (!content) {
          throw new Error('Empty response content from OpenRouter API');
        }

        const tokensUsed = data.usage?.total_tokens || 0;

        return {
          content,
          model,
          tokensUsed,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Attempt ${attempt + 1} failed for model ${model}:`, (error as Error).message);
        
        if (attempt === maxRetries - 1 && modelIndex === models.length - 1) {
          // Last attempt with last model - throw error
          throw error;
        }
        
        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise<void>(resolve => {
            setTimeout(resolve, delay);
          });
        }
      }
    }
  }

  throw new Error('All models and retries exhausted');
}

/**
 * Generate fallback response for users without LLM access
 */
function generateFallbackResponse(message: string): string {
  const responses = [
    "Thanks for your message! I'm a basic chat assistant. For AI-powered responses with access to our knowledge base, please contact david@ideasmen.com.au to request LLM access.",
    "I received your message. Currently, you're using the basic chat experience. To unlock AI features and knowledge base integration, reach out to david@ideasmen.com.au for LLM access.",
    "Hello! I'm operating in basic mode. For advanced AI responses and document search capabilities, please contact david@ideasmen.com.au to request full access.",
    "Your message has been received. I'm providing basic responses right now. To access our full AI capabilities, please contact david@ideasmen.com.au for LLM permissions.",
  ];

  // Simple hash-based selection for consistent responses
  const hash = message.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return responses[Math.abs(hash) % responses.length];
}

/**
 * Create or get chat session for user
 */
export const createOrGetChatSession = action({
  args: {
    userId: v.id('users'),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = crypto.randomUUID();
    
    // Look for existing session for user (most recent)
    const existingSessions = await ctx.runQuery(api.agent.getUserChatSessions, {
      userId: args.userId,
      limit: 1,
    });

    if (existingSessions.length > 0) {
      return existingSessions[0];
    }

    // Create new session
    const sessionId = await ctx.runMutation(api.agent.createChatSession, {
      userId: args.userId,
      title: args.title || 'New Chat',
      correlationId,
    });

    return {
      _id: sessionId,
      userId: args.userId,
      title: args.title || 'New Chat',
      created_at: Date.now(),
      updated_at: Date.now(),
      correlation_id: correlationId,
    };
  },
});