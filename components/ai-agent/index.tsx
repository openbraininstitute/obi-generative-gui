"use client";

import { useState, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, AIAgentProps } from './types';

export function AIAgent({ onExplore, isAIAgentOnRight, onPositionChange }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your assistant. I can help you configure the simulation parameters and explain what each option means. What would you like to know?",
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true
    };

    const command = input.trim().toLowerCase();
    if (command === 'explore') {
      onExplore?.();
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      return;
    }
    if (command === 'do') {
      onExplore?.(false);
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      return;
    }

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Let me help you with that.",
        isUser: false
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg">
      <div className="flex-none px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">SimAI</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="ai-position" className="text-sm">L/R</Label>
            <Switch
              id="ai-position"
              checked={isAIAgentOnRight}
              onCheckedChange={onPositionChange}
              className="data-[state=checked]:bg-gray-600 dark:data-[state=checked]:bg-gray-300 data-[state=unchecked]:bg-gray-600 dark:data-[state=unchecked]:bg-gray-300"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-gray-600 dark:bg-gray-700 text-white'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex-none p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}