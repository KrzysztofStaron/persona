"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { chatWithPersonaStream } from "@/app/actions/chatWithPersonaStream";
import { OpenAI } from "openai";
import {
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Download,
  MessageSquare,
  Users,
  Image as ImageIcon,
  X,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface DebateArgument {
  personaName: string;
  personaImage: string;
  position: "for" | "against";
  argument: string;
  round: number;
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  base64: string;
}

interface DebateState {
  topic: string;
  arguments: DebateArgument[];
  currentRound: number;
  isActive: boolean;
  isGenerating: boolean;
  summary: string;
  isGeneratingSummary: boolean;
}

const ArgumentLab = () => {
  const [inputTopic, setInputTopic] = useState("");
  const [debate, setDebate] = useState<DebateState>({
    topic: "",
    arguments: [],
    currentRound: 0,
    isActive: false,
    isGenerating: false,
    summary: "",
    isGeneratingSummary: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [maxRounds, setMaxRounds] = useState(3);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [wasRestored, setWasRestored] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { personas, generateAll, isClientMounted, isGeneratingPersonas } = usePersonaContext();

  // Local storage key for debate persistence
  const DEBATE_STORAGE_KEY = "argumentlab-debate-state";

  // Save debate state to localStorage
  const saveDebateState = (debateState: DebateState) => {
    try {
      const stateToSave = {
        ...debateState,
        // Don't save generating states to avoid UI confusion on restore
        isGenerating: false,
        isGeneratingSummary: false,
        isActive: false,
      };
      localStorage.setItem(DEBATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save debate state:", error);
    }
  };

  // Load debate state from localStorage
  const loadDebateState = (): DebateState | null => {
    try {
      const saved = localStorage.getItem(DEBATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure
        if (parsed && typeof parsed === "object" && parsed.topic !== undefined) {
          return {
            topic: parsed.topic || "",
            arguments: parsed.arguments || [],
            currentRound: parsed.currentRound || 0,
            isActive: false, // Always start inactive
            isGenerating: false, // Always start not generating
            summary: parsed.summary || "",
            isGeneratingSummary: false, // Always start not generating summary
          };
        }
      }
    } catch (error) {
      console.error("Failed to load debate state:", error);
    }
    return null;
  };

  // Clear saved debate state
  const clearSavedDebateState = () => {
    try {
      localStorage.removeItem(DEBATE_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear debate state:", error);
    }
  };

  // Load debate state on component mount
  useEffect(() => {
    if (isClientMounted) {
      const savedState = loadDebateState();
      if (savedState && (savedState.topic || savedState.arguments.length > 0)) {
        setDebate(savedState);
        setWasRestored(true);
        // Auto-hide the restoration notice after 5 seconds
        setTimeout(() => setWasRestored(false), 5000);
      }
    }
  }, [isClientMounted]);

  // Save debate state whenever it changes (but not on initial load)
  useEffect(() => {
    if (isClientMounted && (debate.topic || debate.arguments.length > 0)) {
      saveDebateState(debate);
    }
  }, [debate, isClientMounted]);

  // Update debate arguments with new avatar images when personas are updated
  useEffect(() => {
    if (personas.length > 0 && debate.arguments.length > 0) {
      setDebate(prevDebate => ({
        ...prevDebate,
        arguments: prevDebate.arguments.map(arg => {
          const matchingPersona = personas.find(p => p.name === arg.personaName);
          return matchingPersona ? { ...arg, personaImage: matchingPersona.image } : arg;
        }),
      }));
    }
  }, [personas]);

  // Cleanup image URLs on component unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, []);

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

  const generateDebateSummary = async (topic: string, debateArguments: DebateArgument[]) => {
    try {
      setDebate(prevDebate => ({
        ...prevDebate,
        isGeneratingSummary: true,
      }));

      // Organize arguments by position
      const forArguments = debateArguments.filter(arg => arg.position === "for");
      const againstArguments = debateArguments.filter(arg => arg.position === "against");

      // Create summary of all arguments
      const forSummary = forArguments.map(arg => `${arg.personaName}: ${arg.argument}`).join("\n\n");
      const againstSummary = againstArguments.map(arg => `${arg.personaName}: ${arg.argument}`).join("\n\n");

      const summaryPrompt = `You are tasked with creating a concise summary of a structured debate about: "${topic}"

SUPPORTING ARGUMENTS:
${forSummary}

OPPOSING ARGUMENTS:
${againstSummary}

Please provide a balanced, objective summary that captures:
1. The main topic being debated
2. The strongest arguments from the supporting side (2-3 key points)
3. The strongest arguments from the opposing side (2-3 key points)
4. Any areas of common ground or consensus
5. The key unresolved tensions or disagreements

Keep it concise but comprehensive - aim for 3-4 paragraphs that give readers a clear understanding of the debate's key points without having to read all individual arguments.`;

      const chatHistory: ChatMessage[] = [
        {
          role: "user",
          content: summaryPrompt,
        },
      ];

      const stream = await chatWithPersonaStream(
        {
          name: "Debate Summarizer",
          personality: ["analytical", "objective"],
          responseTone: ["balanced", "clear"],
        } as any,
        chatHistory
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullSummary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullSummary += chunk;

        // Update summary with streaming content
        setDebate(prevDebate => ({
          ...prevDebate,
          summary: fullSummary,
        }));
      }

      setDebate(prevDebate => ({
        ...prevDebate,
        isGeneratingSummary: false,
      }));
    } catch (error) {
      console.error("Error generating debate summary:", error);
      setDebate(prevDebate => ({
        ...prevDebate,
        isGeneratingSummary: false,
        summary: "Unable to generate summary at this time.",
      }));
    }
  };

  // Auto-start debate after personas are generated
  useEffect(() => {
    const startDebate = async () => {
      if (personas.length > 0 && isLoading && debate.topic && !debate.isActive) {
        console.log("Starting debate on topic:", debate.topic);

        // Split personas into two sides
        const forSide = personas.slice(0, Math.ceil(personas.length / 2));
        const againstSide = personas.slice(Math.ceil(personas.length / 2));

        setDebate(prev => ({
          ...prev,
          isActive: true,
          isGenerating: true,
          currentRound: 1,
        }));

        // Start the first round
        await conductDebateRound(debate.topic, forSide, againstSide, 1, [], uploadedImages);
      }
    };

    startDebate();
  }, [personas.length, isLoading, debate.topic]);

  // Update debate arguments when personas are updated (for avatar generation)
  useEffect(() => {
    if (debate.arguments.length > 0 && personas.length > 0) {
      setDebate(prevDebate => {
        const updatedArguments = [...prevDebate.arguments];
        let hasUpdates = false;

        // Update avatars for matching personas
        updatedArguments.forEach((argument, index) => {
          const matchingPersona = personas.find(p => p.name === argument.personaName);
          if (matchingPersona && matchingPersona.image !== argument.personaImage) {
            updatedArguments[index] = {
              ...argument,
              personaImage: matchingPersona.image,
            };
            hasUpdates = true;
          }
        });

        // Only update state if there were actual changes
        return hasUpdates ? { ...prevDebate, arguments: updatedArguments } : prevDebate;
      });
    }
  }, [personas, debate.arguments.length]);

  const conductDebateRound = async (
    topic: string,
    forSide: any[],
    againstSide: any[],
    round: number,
    previousArguments: DebateArgument[],
    images: UploadedImage[] = []
  ) => {
    try {
      const newArguments: DebateArgument[] = [];

      // Build context from previous arguments
      const contextMessages = previousArguments
        .map(arg => `${arg.personaName} (${arg.position}): ${arg.argument}`)
        .join("\n\n");

      const contextPrompt =
        previousArguments.length > 0
          ? `\n\nPrevious arguments in this debate:\n${contextMessages}\n\nNow respond to these arguments while advancing your position.`
          : "";

      // Generate arguments for the "for" side
      for (const persona of forSide) {
        const debatePrompt = `You are participating in a structured debate about: "${topic}"

You are arguing FOR this position. Present a compelling argument that supports this viewpoint. Be respectful but passionate about your position. Use evidence, examples, and logical reasoning.${contextPrompt}

Keep your argument concise but powerful (2-3 paragraphs maximum).`;

        // Create message content with text and images
        const messageContent: any = [
          {
            type: "text",
            text: debatePrompt,
          },
        ];

        // Add images if present
        images.forEach(image => {
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

        try {
          const stream = await chatWithPersonaStream(persona, chatHistory);
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          // Create initial argument entry
          const argumentEntry: DebateArgument = {
            personaName: persona.name,
            personaImage: persona.image,
            position: "for",
            argument: "",
            round,
          };

          newArguments.push(argumentEntry);

          // Add the initial argument entry to the state once
          setDebate(prevDebate => ({
            ...prevDebate,
            arguments: [...prevDebate.arguments, argumentEntry],
          }));

          // Update debate state with streaming content
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullContent += chunk;

            // Update this specific argument in the state
            setDebate(prevDebate => {
              const updatedArguments = [...prevDebate.arguments];
              const argIndex = updatedArguments.findIndex(
                arg => arg.personaName === persona.name && arg.round === round && arg.position === "for"
              );

              if (argIndex !== -1) {
                updatedArguments[argIndex] = {
                  ...updatedArguments[argIndex],
                  argument: fullContent,
                };
              }

              return {
                ...prevDebate,
                arguments: updatedArguments,
              };
            });
          }

          // Update the final argument in newArguments
          const finalArgIndex = newArguments.findIndex(
            arg => arg.personaName === persona.name && arg.round === round && arg.position === "for"
          );
          if (finalArgIndex !== -1) {
            newArguments[finalArgIndex].argument = fullContent;
          }
        } catch (error) {
          console.error(`Error generating argument for ${persona.name}:`, error);
        }
      }

      // Generate arguments for the "against" side
      for (const persona of againstSide) {
        const debatePrompt = `You are participating in a structured debate about: "${topic}"

You are arguing AGAINST this position. Present a compelling counter-argument that challenges this viewpoint. Be respectful but passionate about your position. Use evidence, examples, and logical reasoning.${contextPrompt}

Keep your argument concise but powerful (2-3 paragraphs maximum).`;

        // Create message content with text and images
        const messageContent: any = [
          {
            type: "text",
            text: debatePrompt,
          },
        ];

        // Add images if present
        images.forEach(image => {
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

        try {
          const stream = await chatWithPersonaStream(persona, chatHistory);
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          // Create initial argument entry
          const argumentEntry: DebateArgument = {
            personaName: persona.name,
            personaImage: persona.image,
            position: "against",
            argument: "",
            round,
          };

          newArguments.push(argumentEntry);

          // Add the initial argument entry to the state once
          setDebate(prevDebate => ({
            ...prevDebate,
            arguments: [...prevDebate.arguments, argumentEntry],
          }));

          // Update debate state with streaming content
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullContent += chunk;

            // Update this specific argument in the state
            setDebate(prevDebate => {
              const updatedArguments = [...prevDebate.arguments];
              const argIndex = updatedArguments.findIndex(
                arg => arg.personaName === persona.name && arg.round === round && arg.position === "against"
              );

              if (argIndex !== -1) {
                updatedArguments[argIndex] = {
                  ...updatedArguments[argIndex],
                  argument: fullContent,
                };
              }

              return {
                ...prevDebate,
                arguments: updatedArguments,
              };
            });
          }

          // Update the final argument in newArguments
          const finalArgIndex = newArguments.findIndex(
            arg => arg.personaName === persona.name && arg.round === round && arg.position === "against"
          );
          if (finalArgIndex !== -1) {
            newArguments[finalArgIndex].argument = fullContent;
          }
        } catch (error) {
          console.error(`Error generating argument for ${persona.name}:`, error);
        }
      }

      // Update final debate state
      setDebate(prevDebate => ({
        ...prevDebate,
        isGenerating: false,
      }));

      // Check if we should continue to next round
      if (round < maxRounds) {
        // Continue to next round after a brief delay
        setTimeout(() => {
          setDebate(prevDebate => {
            const updatedDebate = {
              ...prevDebate,
              currentRound: round + 1,
              isGenerating: true,
            };

            // Start next round with current arguments
            conductDebateRound(topic, forSide, againstSide, round + 1, updatedDebate.arguments, images);

            return updatedDebate;
          });
        }, 2000);
      } else {
        // Debate finished
        setDebate(prevDebate => ({
          ...prevDebate,
          isActive: false,
          isGenerating: false,
        }));
        setIsLoading(false);

        // Generate summary after debate completion
        setTimeout(() => {
          generateDebateSummary(topic, [...previousArguments, ...newArguments]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error conducting debate round:", error);
      setDebate(prevDebate => ({
        ...prevDebate,
        isGenerating: false,
        isActive: false,
      }));
      setIsLoading(false);
    }
  };

  const handleStartDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTopic.trim() && uploadedImages.length === 0) return;

    setIsLoading(true);
    const topic = inputTopic.trim();

    try {
      // If no personas exist, generate them based on the topic
      if (personas.length === 0) {
        console.log("Generating personas for debate topic:", topic);

        // Set the debate topic
        setDebate(prev => ({
          ...prev,
          topic,
          arguments: [],
          currentRound: 0,
          isActive: false,
          isGenerating: false,
        }));

        // Generate personas that will have opposing viewpoints
        await generateAll(
          true,
          undefined,
          4,
          `Generate diverse personas with different perspectives who can debate: ${topic}`
        );

        // Clear the input and images
        setInputTopic("");
        uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
        setUploadedImages([]);
        return;
      }

      // If personas exist, start the debate immediately
      setDebate(prev => ({
        ...prev,
        topic,
        arguments: [],
        currentRound: 0,
        isActive: false,
        isGenerating: false,
      }));

      // Split personas into two sides
      const forSide = personas.slice(0, Math.ceil(personas.length / 2));
      const againstSide = personas.slice(Math.ceil(personas.length / 2));

      setDebate(prev => ({
        ...prev,
        isActive: true,
        isGenerating: true,
        currentRound: 1,
      }));

      setInputTopic("");
      // Clear uploaded images
      uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
      const imagesToInclude = [...uploadedImages];
      setUploadedImages([]);

      // Start the first round
      await conductDebateRound(topic, forSide, againstSide, 1, [], imagesToInclude);
    } catch (error) {
      console.error("Error starting debate:", error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDebate({
      topic: "",
      arguments: [],
      currentRound: 0,
      isActive: false,
      isGenerating: false,
      summary: "",
      isGeneratingSummary: false,
    });
    setIsLoading(false);
    // Clear uploaded images
    uploadedImages.forEach(image => URL.revokeObjectURL(image.url));
    setUploadedImages([]);
    // Clear saved state
    clearSavedDebateState();
    // Clear restoration flag
    setWasRestored(false);
  };

  const handleDownloadDebate = () => {
    if (debate.arguments.length === 0) return;

    const debateData = {
      topic: debate.topic,
      rounds: maxRounds,
      arguments: debate.arguments,
      summary: debate.summary,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(debateData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `debate-${debate.topic.replace(/[^a-zA-Z0-9]/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Group arguments by round
  const argumentsByRound = debate.arguments.reduce((acc, argument) => {
    if (!acc[argument.round]) {
      acc[argument.round] = [];
    }
    acc[argument.round].push(argument);
    return acc;
  }, {} as Record<number, DebateArgument[]>);

  return (
    <div className="mt-12">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              Argument Lab
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Explore different perspectives through structured debates</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadDebate}
              variant="outline"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 px-4 h-[42px] w-full sm:w-auto"
              disabled={debate.arguments.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Debate
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 px-4 h-[42px] w-full sm:w-auto"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Restoration Notice */}
        {wasRestored && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Previous debate restored</span>
              <button
                onClick={() => setWasRestored(false)}
                className="ml-auto text-green-400 hover:text-green-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(isGeneratingPersonas || debate.isGenerating || debate.isGeneratingSummary) && (
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isGeneratingPersonas ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  <span className={`text-sm ${isGeneratingPersonas ? "text-blue-400" : "text-green-400"}`}>
                    {isGeneratingPersonas ? "Generating debate participants..." : "Participants ready"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {debate.isGenerating ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : debate.isActive ? (
                    <Pause className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-600"></div>
                  )}
                  <span
                    className={`text-sm ${
                      debate.isGenerating ? "text-blue-400" : debate.isActive ? "text-yellow-400" : "text-zinc-500"
                    }`}
                  >
                    {debate.isGenerating
                      ? `Generating Round ${debate.currentRound} arguments...`
                      : debate.isActive
                      ? "Debate paused"
                      : "Ready to debate"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {debate.isGeneratingSummary ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  ) : debate.summary ? (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-600"></div>
                  )}
                  <span
                    className={`text-sm ${
                      debate.isGeneratingSummary
                        ? "text-purple-400"
                        : debate.summary
                        ? "text-purple-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {debate.isGeneratingSummary
                      ? "Generating debate summary..."
                      : debate.summary
                      ? "Summary complete"
                      : "Summary pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Central Input Field */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleStartDebate} className="mb-4">
            {/* Mobile-first responsive layout */}
            <div className="space-y-3 sm:space-y-0">
              {/* Input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputTopic}
                  onChange={e => setInputTopic(e.target.value)}
                  placeholder={
                    personas.length === 0
                      ? "Enter a topic for debate or upload images (e.g., 'AI will replace human creativity')"
                      : "Enter a new debate topic or upload images..."
                  }
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-base sm:text-lg"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="text-zinc-400 border-zinc-700 hover:bg-zinc-800 h-[50px] w-[50px] sm:h-[58px] sm:w-[58px] flex items-center justify-center flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Controls row - stacked on mobile, spaced on larger screens */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={maxRounds}
                  onChange={e => setMaxRounds(Number(e.target.value))}
                  className="px-4 py-3 sm:py-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 h-[50px] sm:h-[58px] sm:min-w-[140px]"
                  disabled={isLoading}
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                  <option value={4}>4 Rounds</option>
                </select>
                <Button
                  type="submit"
                  variant="outline"
                  className="text-white px-6 sm:px-8 h-[50px] sm:h-[58px] flex items-center justify-center w-full sm:w-auto sm:min-w-[140px]"
                  disabled={isLoading || (!inputTopic.trim() && uploadedImages.length === 0)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      {isGeneratingPersonas ? "Preparing..." : "Starting..."}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Debate
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

        {/* Debate Topic Display */}
        {debate.topic && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="bg-zinc-900/50 border-zinc-700 p-4">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Debate Topic</h3>
                <p className="text-zinc-300 text-base sm:text-lg break-words px-2 sm:px-0">{debate.topic}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4 text-sm text-zinc-400">
                  <span>
                    Round: {debate.arguments.length > 0 ? Math.max(...debate.arguments.map(arg => arg.round)) : 0}/
                    {debate.arguments.length > 0 ? Math.max(...debate.arguments.map(arg => arg.round)) : 0}
                  </span>
                  <span>Arguments: {debate.arguments.length}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Debate Content */}
      <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-0">
        {Object.keys(argumentsByRound).length > 0 && (
          <div className="space-y-8">
            {Object.entries(argumentsByRound)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, roundArguments]) => (
                <div key={round} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                      Round {round}
                    </Badge>
                    <div className="flex-1 h-px bg-zinc-700"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* For arguments */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Supporting Arguments
                      </h4>
                      {roundArguments
                        .filter(arg => arg.position === "for")
                        .map((argument, index) => (
                          <Card key={index} className="bg-green-900/20 border-green-800/50 p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                                {argument.personaImage ? (
                                  <AvatarImage src={argument.personaImage} alt={argument.personaName} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
                                  </div>
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs sm:text-sm">
                                  {argument.personaName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-green-300 font-medium mb-1 text-sm sm:text-base truncate">
                                  {argument.personaName}
                                </p>
                                <div className="text-zinc-300 text-sm leading-relaxed">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      em: ({ children }) => <em className="italic">{children}</em>,
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                                      ),
                                      li: ({ children }) => <li className="text-sm">{children}</li>,
                                    }}
                                  >
                                    {argument.argument}
                                  </ReactMarkdown>
                                  {/* Show loading state */}
                                  {debate.isGenerating && !argument.argument && (
                                    <span className="text-zinc-500 text-sm italic">Preparing argument...</span>
                                  )}
                                  {/* Show cursor while streaming */}
                                  {debate.isGenerating && argument.argument && (
                                    <span className="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>

                    {/* Against arguments */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Opposing Arguments
                      </h4>
                      {roundArguments
                        .filter(arg => arg.position === "against")
                        .map((argument, index) => (
                          <Card key={index} className="bg-red-900/20 border-red-800/50 p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                                {argument.personaImage ? (
                                  <AvatarImage src={argument.personaImage} alt={argument.personaName} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
                                  </div>
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs sm:text-sm">
                                  {argument.personaName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-red-300 font-medium mb-1 text-sm sm:text-base truncate">
                                  {argument.personaName}
                                </p>
                                <div className="text-zinc-300 text-sm leading-relaxed">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      em: ({ children }) => <em className="italic">{children}</em>,
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                                      ),
                                      li: ({ children }) => <li className="text-sm">{children}</li>,
                                    }}
                                  >
                                    {argument.argument}
                                  </ReactMarkdown>
                                  {/* Show loading state */}
                                  {debate.isGenerating && !argument.argument && (
                                    <span className="text-zinc-500 text-sm italic">Preparing argument...</span>
                                  )}
                                  {/* Show cursor while streaming */}
                                  {debate.isGenerating && argument.argument && (
                                    <span className="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Debate Summary */}
        {(debate.summary || debate.isGeneratingSummary) && (
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                Debate Summary
              </Badge>
              <div className="flex-1 h-px bg-zinc-700"></div>
            </div>

            <Card className="bg-zinc-900/80 border-zinc-700 p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Key Points & Takeaways</h3>
                  <div className="text-zinc-300 text-sm leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mb-2 text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-white">{children}</h3>,
                      }}
                    >
                      {debate.summary}
                    </ReactMarkdown>
                    {/* Show loading state */}
                    {debate.isGeneratingSummary && !debate.summary && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-zinc-500 text-sm italic">Analyzing debate and generating summary...</span>
                      </div>
                    )}
                    {/* Show cursor while streaming */}
                    {debate.isGeneratingSummary && debate.summary && (
                      <span className="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5"></span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {debate.arguments.length === 0 && !isLoading && (
          <div className="text-center py-8">
            {personas.length === 0 ? (
              <div className="p-8 rounded-lg border border-zinc-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Users className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-lg font-medium">Ready to start a debate!</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Enter a topic or upload images above to generate participants and begin a structured argument
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-lg border border-zinc-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-lg font-medium">Participants ready!</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Enter a debate topic or upload images to see how different perspectives clash
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-zinc-400">
              {isGeneratingPersonas ? "Generating debate participants..." : "Preparing arguments..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArgumentLab;
