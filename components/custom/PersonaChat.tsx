"use client";

import React, { useState } from "react";
import { Persona } from "@/types/persona";
import { chatWithPersona } from "@/app/actions/chatWithPersona";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PersonaChatProps {
  persona: Persona;
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const PersonaChat: React.FC<PersonaChatProps> = ({ persona, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: inputMessage };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const chatHistory = updatedMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const response = await chatWithPersona(persona, chatHistory);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response || "I'm sorry, I couldn't respond right now.",
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, something went wrong. Please try again.",
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {persona.image ? (
                <AvatarImage src={persona.image} alt={persona.name} />
              ) : (
                <AvatarFallback className="bg-zinc-700 text-zinc-200">{persona.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-white">{persona.name}</DialogTitle>
              <DialogDescription className="text-zinc-400">Chat with {persona.name}</DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {persona.personality.map((trait, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border-zinc-600"
              >
                {trait}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 py-8">
              <p>Start a conversation with {persona.name}!</p>
              <p className="text-sm mt-2">{persona.biography}</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-100 rounded-lg p-3 max-w-[70%]">
                <p className="text-sm">Typing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-700 pt-4">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${persona.name}...`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonaChat;
