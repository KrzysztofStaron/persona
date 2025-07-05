import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PersonaCardSkeleton = () => {
  return (
    <Card className="pl-4 transition-all duration-200 h-max border-zinc-700 relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar Skeleton */}
          <div className="w-18 aspect-[3/4] rounded-md overflow-hidden bg-zinc-800">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 min-w-0">
            {/* Name Skeleton */}
            <Skeleton className="h-6 w-32 mb-2" />

            {/* Personality Badges Skeleton */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-18" />
            </div>

            {/* Biography/Description Skeleton */}
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Chat indicator Skeleton */}
            <div className="mt-3 pt-2 border-t border-zinc-700">
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaCardSkeleton;
