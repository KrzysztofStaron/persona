"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { chatWithPersonaStream } from "@/app/actions/chatWithPersonaStream";
import { OpenAI } from "openai";
import { Loader2, Send, Download, Image as ImageIcon, X, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface PersonaResponse {
  personaName: string;
  personaImage: string;
  response: string;
}

interface UserMessage {
  text: string;
  images: UploadedImage[];
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  base64: string;
}

const ChatWithAll = () => {
  const [inputValue, setInputValue] = useState("");
  const [responses, setResponses] = useState<PersonaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<UserMessage | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateTheme, setGenerateTheme] = useState("");
  const [generateCount, setGenerateCount] = useState(4);
  const [hasUserDismissedDialog, setHasUserDismissedDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { personas, generateAll, isClientMounted, isGeneratingPersonas } = usePersonaContext();

  // Cleanup image URLs on component unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
      if (currentUserMessage) {
        currentUserMessage.images.forEach(image => URL.revokeObjectURL(image.url));
      }
    };
  }, []);

  // Auto-open generation dialog when no personas are available
  useEffect(() => {
    if (
      isClientMounted &&
      personas.length === 0 &&
      !isGeneratingPersonas &&
      !isGenerateDialogOpen &&
      !hasUserDismissedDialog
    ) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        setIsGenerateDialogOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, personas.length, isGeneratingPersonas, isGenerateDialogOpen, hasUserDismissedDialog]);

  // Reset dismissed flag when personas are generated
  useEffect(() => {
    if (personas.length > 0) {
      setHasUserDismissedDialog(false);
    }
  }, [personas.length]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = e => {
          const base64 = e.target?.result as string;
          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            url: URL.createObjectURL(file),
            base64,
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || uploadedImages.length > 0) && personas.length > 0) {
      setIsLoading(true);

      try {
        // Create chat history with user message including images
        const messageContent: any = [];

        // Add text if present
        if (inputValue.trim()) {
          messageContent.push({
            type: "text",
            text: inputValue.trim(),
          });
        }

        // Add images if present
        uploadedImages.forEach(image => {
          messageContent.push({
            type: "image_url",
            image_url: {
              url: image.base64,
            },
          });
        });

        const chatHistory: ChatMessage[] = [
          {
            role: "user",
            content: messageContent,
          },
        ];

        // Save the current user message
        setCurrentUserMessage({
          text: inputValue.trim(),
          images: [...uploadedImages],
        });

        // Initialize responses for all personas
        const initialResponses: PersonaResponse[] = personas.map(persona => ({
          personaName: persona.name,
          personaImage: persona.image,
          response: "",
        }));
        setResponses(initialResponses);
        setInputValue("");
        // Clear uploaded images
        uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
        setUploadedImages([]);

        // Create promises for all persona streams
        const streamPromises = personas.map(async (persona, index) => {
          try {
            const stream = await chatWithPersonaStream(persona, chatHistory);
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              fullContent += chunk;

              // Update this persona's response
              setResponses(prevResponses => {
                const newResponses = [...prevResponses];
                if (newResponses[index]) {
                  newResponses[index].response = fullContent;
                }
                return newResponses;
              });
            }
          } catch (error) {
            console.error(`Error chatting with ${persona.name}:`, error);
            setResponses(prevResponses => {
              const newResponses = [...prevResponses];
              if (newResponses[index]) {
                newResponses[index].response = "Error: Could not get response";
              }
              return newResponses;
            });
          }
        });

        // Wait for all streams to complete
        await Promise.all(streamPromises);
      } catch (error) {
        console.error("Error chatting with personas:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClear = () => {
    setResponses([]);
    // Clear current user message images
    if (currentUserMessage) {
      currentUserMessage.images.forEach(image => URL.revokeObjectURL(image.url));
    }
    setCurrentUserMessage(null);
    // Clear uploaded images
    uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
    setUploadedImages([]);
  };

  const handleDownloadPersonas = () => {
    if (personas.length === 0) return;

    const dataStr = JSON.stringify(personas, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `personas-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleGenerateSubmit = () => {
    generateAll(true, generateTheme.trim() || undefined, generateCount);
    setIsGenerateDialogOpen(false);
    setGenerateTheme("");
    setGenerateCount(4);
  };

  const handleGenerateCancel = () => {
    setIsGenerateDialogOpen(false);
    setGenerateTheme("");
    setGenerateCount(4);
    setHasUserDismissedDialog(true);
  };

  const handleGenerateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerateSubmit();
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 30) {
      setGenerateCount(value);
    }
  };

  const handleChatSectionClick = () => {
    if (personas.length === 0) {
      setIsGenerateDialogOpen(true);
      setHasUserDismissedDialog(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Chat with All Personas</h2>
          <Button
            onClick={handleDownloadPersonas}
            variant="outline"
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 px-6 h-[42px]"
            disabled={personas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Personas
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask something to all personas..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              disabled={isLoading || personas.length === 0}
            />
            <Button
              type="button"
              variant="outline"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 h-[42px] w-[42px] flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || personas.length === 0}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="text-white px-6 h-[42px] flex items-center justify-center"
              disabled={isLoading || personas.length === 0 || (!inputValue.trim() && uploadedImages.length === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Display uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              {uploadedImages.map(image => (
                <div key={image.id} className="relative group">
                  <img src={image.url} alt={image.file.name} className="w-16 h-16 object-cover rounded-lg" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </form>

        {responses.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-zinc-400 text-sm">
              {responses.length} response{responses.length !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={handleClear}
              variant="outline"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 px-4 h-[34px] text-sm"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Show user's message */}
        {currentUserMessage && (
          <Card className="bg-zinc-900/50 border-zinc-700 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">You</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">You</p>
                <div className="space-y-2">
                  {currentUserMessage.text && (
                    <p className="text-zinc-300 text-sm leading-relaxed">{currentUserMessage.text}</p>
                  )}
                  {currentUserMessage.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentUserMessage.images.map(image => (
                        <img
                          key={image.id}
                          src={image.url}
                          alt={image.file.name}
                          className="w-24 h-24 object-cover rounded-lg border border-zinc-700"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {responses.map((response, index) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={response.personaImage} alt={response.personaName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {response.personaName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">{response.personaName}</p>
                <div className="text-zinc-300 text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-zinc-800/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-zinc-800/50 p-2 rounded overflow-x-auto text-xs font-mono mt-2 mb-2">
                          {children}
                        </pre>
                      ),
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-zinc-600 pl-2 italic text-zinc-400 my-2">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-blue-400 hover:text-blue-300 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {response.response}
                  </ReactMarkdown>
                  {/* Show loading state */}
                  {isLoading && !response.response && <span className="text-zinc-500 text-sm italic">Thinking...</span>}
                  {/* Show cursor while streaming */}
                  {isLoading && response.response && (
                    <span className="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5"></span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {responses.length === 0 && !isLoading && (
        <div className="text-center py-8">
          {personas.length === 0 ? (
            <div
              className="cursor-pointer p-8 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-600 transition-colors group"
              onClick={handleChatSectionClick}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <Plus className="w-8 h-8 text-zinc-400 group-hover:text-zinc-300" />
                </div>
                <div>
                  <p className="text-zinc-400 text-lg font-medium group-hover:text-zinc-300">No personas available</p>
                  <p className="text-zinc-500 text-sm mt-1">Click here to generate personas first</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500">No responses yet. Ask something to see what each persona thinks!</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-zinc-400">Getting responses from all personas...</p>
        </div>
      )}

      {/* Generate Personas Dialog */}
      <Dialog
        open={isGenerateDialogOpen}
        onOpenChange={open => {
          setIsGenerateDialogOpen(open);
          if (!open) {
            setHasUserDismissedDialog(true);
          }
        }}
      >
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Generate Personas</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a theme to generate unique personas around. Leave empty to use the default theme.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <input
                type="text"
                placeholder="e.g., cyberpunk hackers, medieval knights, space explorers..."
                value={generateTheme}
                onChange={e => setGenerateTheme(e.target.value)}
                onKeyPress={handleGenerateKeyPress}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="generate-count" className="text-sm text-zinc-400 font-medium">
                Number of personas:
              </label>
              <input
                id="generate-count"
                type="number"
                min="1"
                max="30"
                value={generateCount}
                onChange={handleCountChange}
                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-zinc-500">(max 30)</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleGenerateCancel}
              variant="outline"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWithAll;
