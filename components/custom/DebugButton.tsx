"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { devCache } from "@/lib/devCache";

interface DebugButtonProps {
  onRegenerate: () => void;
}

const DebugButton: React.FC<DebugButtonProps> = ({ onRegenerate }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  if (!devCache.isDev()) {
    return null;
  }

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
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-xl">
          <h3 className="text-white font-semibold mb-3">Debug Tools</h3>
          <div className="space-y-2">
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
