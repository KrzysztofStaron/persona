"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { chatWithPersonaStream } from "@/app/actions/chatWithPersonaStream";
import { OpenAI } from "openai";
import { Loader2, Send, Download, Image as ImageIcon, X, Plus, Check, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);

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

  // Auto-continue chat after personas are generated from a question
  useEffect(() => {
    const continueWithQuestion = async () => {
      if (personas.length > 0 && isLoading && currentUserMessage && currentUserMessage.text) {
        // Personas were just generated, now answer the original question
        console.log("Continuing with original question:", currentUserMessage.text);

        const messageContent: any = [];

        // Add text
        messageContent.push({
          type: "text",
          text: currentUserMessage.text,
        });

        // Add images if present
        currentUserMessage.images.forEach(image => {
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

        // Initialize responses for all personas
        const initialResponses: PersonaResponse[] = personas.map(persona => ({
          personaName: persona.name,
          personaImage: persona.image,
          response: "",
        }));
        setResponses(initialResponses);
        setIsGeneratingResponses(true);

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
        setIsGeneratingResponses(false);
        setIsLoading(false);
      }
    };

    continueWithQuestion();
  }, [personas.length, isLoading, currentUserMessage]);

  // Update response avatars when personas are updated (for avatar generation)
  useEffect(() => {
    if (responses.length > 0 && personas.length > 0) {
      setResponses(prevResponses => {
        const updatedResponses = [...prevResponses];
        let hasUpdates = false;

        // Update avatars for matching personas
        updatedResponses.forEach((response, index) => {
          const matchingPersona = personas.find(p => p.name === response.personaName);
          if (matchingPersona && matchingPersona.image !== response.personaImage) {
            updatedResponses[index] = {
              ...response,
              personaImage: matchingPersona.image,
            };
            hasUpdates = true;
          }
        });

        // Only update state if there were actual changes
        return hasUpdates ? updatedResponses : prevResponses;
      });
    }
  }, [personas, responses.length]);

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
    if (!inputValue.trim() && uploadedImages.length === 0) return;

    setIsLoading(true);

    try {
      // If no personas exist, generate them based on the question
      if (personas.length === 0 && inputValue.trim()) {
        console.log("Generating personas for question:", inputValue.trim());

        // Save the current user message for later use
        setCurrentUserMessage({
          text: inputValue.trim(),
          images: [...uploadedImages],
        });

        await generateAll(true, undefined, 4, inputValue.trim());

        // Clear the input but keep the loading state until personas are generated
        setInputValue("");
        uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
        setUploadedImages([]);
        return;
      }

      // Normal chat flow when personas exist
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
      setIsGeneratingResponses(true);
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
      setIsGeneratingResponses(false);
      setIsLoading(false);
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
    // Reset progress states
    setIsGeneratingResponses(false);
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

  return (
    <div className="mt-12">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Chat with All Personas</h2>
          <Button
            onClick={handleDownloadPersonas}
            variant="outline"
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 px-6 h-[42px] "
            disabled={personas.length === 0}
          >
            <Download className="w-4 h-4" />
            <span className="ml-2 hidden sm:block">Download Personas</span>
          </Button>
        </div>

        {/* Progress Indicator */}
        {(isGeneratingPersonas || isGeneratingResponses) && (
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {isGeneratingPersonas ? (
                  <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                ) : (
                  <Check className="w-5 h-5 text-green-400" />
                )}
                <span className={`text-sm ${isGeneratingPersonas ? "text-blue-400" : "text-green-400"}`}>
                  Generating relevant personas
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isGeneratingResponses ? (
                  <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                ) : personas.length > 0 && !isGeneratingPersonas ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-600"></div>
                )}
                <span
                  className={`text-sm ${
                    isGeneratingResponses
                      ? "text-blue-400"
                      : personas.length > 0 && !isGeneratingPersonas
                      ? "text-green-400"
                      : "text-zinc-500"
                  }`}
                >
                  Generating responses
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Central Text Field */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={
                  personas.length === 0
                    ? "Ask a question to generate relevant personas..."
                    : "Ask something to all personas..."
                }
                className="flex-1 px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-lg"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 h-[58px] w-[58px] flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="text-white px-8 h-[58px] flex items-center justify-center flex-1 sm:flex-none"
                  disabled={isLoading || (!inputValue.trim() && uploadedImages.length === 0)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isGeneratingPersonas ? "Creating..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
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
        </div>

        {responses.length > 0 && (
          <div className="max-w-4xl mx-auto">
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
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            {personas.length === 0 ? (
              <div className="p-8 rounded-lg border border-zinc-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-lg font-medium">Ready for your first question!</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Ask any question above to generate relevant personas and get diverse perspectives
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500">No responses yet. Ask something to see what each persona thinks!</p>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-zinc-400">
              {isGeneratingPersonas ? "Creating relevant personas..." : "Getting responses from all personas..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWithAll;
