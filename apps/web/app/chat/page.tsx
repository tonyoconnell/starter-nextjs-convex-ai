'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatMessage } from '@/types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // TODO: Replace with actual AI service call in Story 4.3
    try {
      // Simulate AI response delay
      await new Promise(resolve => window.setTimeout(resolve, 1000));

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: `I received your message: "${content}". This is a placeholder response. The actual AI integration will be implemented in Story 4.3.`,
        role: 'assistant',
        timestamp: Date.now(),
        status: 'sent',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: Date.now(),
        status: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto h-screen flex flex-col p-4">
      {/* Home Navigation */}
      <div className="text-left mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="mr-1">←</span>
          Back to Home
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about this project and get AI-powered answers.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}