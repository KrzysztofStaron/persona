"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { devCache } from "@/lib/devCache";

interface DebugButtonProps {
  onRegenerate: (theme?: string) => void;
}

const DebugButton: React.FC<DebugButtonProps> = ({ onRegenerate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateTheme, setRegenerateTheme] = useState("");

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isClientMounted) {
      // Update chat count when visible
      const updateChatCount = () => {
        const allChats = devCache.getAllChats();
        setChatCount(Object.keys(allChats).length);
      };

      if (isVisible) {
        updateChatCount();
        // Update chat count every 2 seconds when panel is visible
        const interval = setInterval(updateChatCount, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [isVisible, isClientMounted]);

  // Only show in development mode and after client mount
  if (!isClientMounted || !devCache.isDev()) {
    return null;
  }

  const handleDownloadChats = () => {
    try {
      devCache.downloadAllChats();
      setIsVisible(false);
    } catch (error) {
      console.error("Failed to download chats:", error);
    }
  };

  const handleClearChats = () => {
    if (window.confirm("Are you sure you want to clear all chat histories? This action cannot be undone.")) {
      devCache.clearAllChats();
      setChatCount(0);
    }
  };

  const handleRegenerateSubmit = () => {
    onRegenerate(regenerateTheme.trim() || undefined);
    setIsRegenerateDialogOpen(false);
    setRegenerateTheme("");
    setIsVisible(false);
  };

  const handleRegenerateCancel = () => {
    setIsRegenerateDialogOpen(false);
    setRegenerateTheme("");
  };

  const handleRegenerateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegenerateSubmit();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {!isVisible && (
          <Button
            onClick={() => setIsVisible(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg"
            size="sm"
          >
            🔧 Debug
          </Button>
        )}

        {isVisible && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-xl min-w-[200px]">
            <h3 className="text-white font-semibold mb-3">Debug Tools</h3>

            {/* Chat Tools */}
            <div className="mb-4 pb-3 border-b border-zinc-700">
              <h4 className="text-zinc-300 text-sm font-medium mb-2">Chat Management</h4>
              <p className="text-zinc-400 text-xs mb-2">
                {chatCount} active chat{chatCount !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={handleDownloadChats}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                  size="sm"
                  disabled={chatCount === 0}
                >
                  📥 Download Chats JSON
                </Button>
                <Button
                  onClick={handleClearChats}
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  size="sm"
                  disabled={chatCount === 0}
                >
                  🗑️ Clear All Chats
                </Button>
              </div>
            </div>

            {/* Persona Tools */}
            <div className="space-y-2">
              <h4 className="text-zinc-300 text-sm font-medium mb-2">Persona Management</h4>
              <Button
                onClick={() => setIsRegenerateDialogOpen(true)}
                className=" text-white w-full"
                size="sm"
                variant="outline"
              >
                🔄 Regenerate All
              </Button>
              <Button
                onClick={() => {
                  devCache.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
                size="sm"
              >
                🗑️ Clear Cache
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                className="bg-zinc-600 hover:bg-zinc-700 text-white w-full"
                size="sm"
              >
                ❌ Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Regenerate Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Regenerate All Personas</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a theme to generate new personas around. Leave empty to use default theme.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <input
              type="text"
              placeholder="e.g., cyberpunk hackers, medieval knights, space explorers..."
              value={regenerateTheme}
              onChange={e => setRegenerateTheme(e.target.value)}
              onKeyPress={handleRegenerateKeyPress}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <DialogFooter>
            <Button onClick={handleRegenerateCancel} className="bg-zinc-600 hover:bg-zinc-700 text-white">
              Cancel
            </Button>
            <Button onClick={handleRegenerateSubmit} className="bg-accent hover:bg-accent/80 text-white">
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DebugButton;
