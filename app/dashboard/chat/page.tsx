"use client";
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, Settings, RefreshCw, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { getSystemPrompt, setSystemPrompt, resetSystemPrompt } from '@/lib/llm/utils';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const MarkdownStyles = {
  p: 'mb-2 last:mb-0',
  h3: 'text-lg font-semibold mt-2 mb-1',
  ul: 'list-disc pl-4 mb-2',
  li: 'mb-1',
  code: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
  strong: 'font-semibold',
};

export default function ChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [systemPrompt, setSystemPromptState] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSystemPromptState(getSystemPrompt('chat'));
    // Check for API key on load
    const defaultLLM = localStorage.getItem('default-llm') || 'groq';
    const apiKeys = JSON.parse(localStorage.getItem('llm-api-keys') || '{}');
    if (!apiKeys[defaultLLM]) {
      setConfigError('Please configure your LLM provider and API key in Settings.');
    } else {
      setConfigError(null);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check for API key before sending message
    const defaultLLM = localStorage.getItem('default-llm') || 'groq';
    const apiKeys = JSON.parse(localStorage.getItem('llm-api-keys') || '{}');
    if (!apiKeys[defaultLLM]) {
      toast({
        title: "Configuration Required",
        description: (
          <div className="flex flex-col gap-2">
            <p>Please configure your LLM provider and API key in Settings.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/dashboard/settings'}
              className="mt-2"
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const llmConfig = JSON.parse(localStorage.getItem(`${defaultLLM}-config`) || '{}');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-llm-provider': defaultLLM,
          'x-api-key': apiKeys[defaultLLM] || '',
          'x-llm-config': JSON.stringify(llmConfig)
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemPrompt: getSystemPrompt('chat')
        }),
      });

      const data = await response.json();
      
      if (response.status === 401 && data.action === 'configure_llm') {
        toast({
          title: "Configuration Required",
          description: (
            <div className="flex flex-col gap-2">
              <p>{data.message}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/dashboard/settings'}
                className="mt-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }
      
      if (!response.ok) throw new Error('Failed to get response');

      const assistantMessage: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemPromptSave = () => {
    setSystemPrompt('chat', systemPrompt);
    setShowSettings(false);
    toast({
      title: "Success",
      description: "System prompt updated successfully.",
    });
  };

  const handleSystemPromptReset = () => {
    resetSystemPrompt('chat');
    setSystemPromptState(getSystemPrompt('chat'));
    toast({
      title: "Success",
      description: "System prompt reset to default.",
    });
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <div className="flex flex-col h-[80vh]">
          {/* Chat Header */}
          <div className="border-b p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Curio</h2>
                  <p className="text-sm text-muted-foreground">
                    Your AI Financial Assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="hover:bg-primary/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
            {configError ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Configuration Required</h3>
                <p className="text-sm text-muted-foreground mb-4">{configError}</p>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/settings'}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Go to Settings
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 px-4">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to Curio!</h3>
                <p className="text-sm max-w-md mx-auto">
                  I'm here to help you understand your finances better. Ask me anything about your spending, budgets, or financial goals.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 transition-all duration-300 ease-in-out",
                    message.role === 'assistant' ? 'fade-right' : 'fade-left',
                    "animate-in slide-in-from-bottom-4"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    message.role === 'assistant' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {message.role === 'assistant' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg p-4 max-w-[85%] shadow-sm",
                    message.role === 'assistant'
                      ? 'bg-card text-card-foreground prose prose-sm max-w-none'
                      : 'bg-primary text-primary-foreground'
                  )}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className={MarkdownStyles.p}>{children}</p>,
                          h3: ({ children }) => <h3 className={MarkdownStyles.h3}>{children}</h3>,
                          ul: ({ children }) => <ul className={MarkdownStyles.ul}>{children}</ul>,
                          li: ({ children }) => <li className={MarkdownStyles.li}>{children}</li>,
                          code: ({ children }) => <code className={MarkdownStyles.code}>{children}</code>,
                          strong: ({ children }) => <strong className={MarkdownStyles.strong}>{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-lg p-4 bg-card shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-150" />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t p-4 bg-card">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={configError ? "Please configure API key in settings first..." : "Ask me anything about your finances..."}
                disabled={isLoading || !!configError}
                className="flex-1 bg-background"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim() || !!configError}
                className="shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Customize how Curio behaves and responds to your messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPromptState(e.target.value)}
                placeholder="Enter system prompt..."
                className="h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                This prompt defines how Curio behaves and responds to your messages.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleSystemPromptReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSystemPromptSave}
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
