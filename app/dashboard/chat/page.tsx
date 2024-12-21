"use client";
import { useState } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent actual submission and show "not implemented" message
    const userMessage: Message = { role: 'user', content: input };
    const assistantMessage: Message = { 
      role: 'assistant', 
      content: 'Sorry, the chat functionality has not been implemented yet. Please check back later.' 
    };
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto mb-4 bg-red-100 border-red-400 border rounded-lg p-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700">This feature has not been implemented yet. The chat bot is currently unavailable.</p>
      </div>
      <Card className="max-w-4xl mx-auto">
        <div className="flex flex-col h-[80vh]">
          {/* Chat Header */}
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">Financial Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your finances and spending habits
            </p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start a conversation by sending a message</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  message.role === 'assistant' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'assistant'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
