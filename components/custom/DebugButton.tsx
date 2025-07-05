"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { devCache } from "@/lib/devCache";

interface DebugButtonProps {
  onRegenerate: () => void;
}

const DebugButton: React.FC<DebugButtonProps> = ({ onRegenerate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [chatCount, setChatCount] = useState(0);

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

  return (
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
              onClick={() => {
                onRegenerate();
                setIsVisible(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              size="sm"
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
  );
};

export default DebugButton;
