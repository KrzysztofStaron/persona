import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Persona } from "@/types/persona";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const PersonaCard = ({ persona }: { persona: Persona }) => {
  return (
    <Card className="pl-4 transition-colors h-max">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-18 aspect-[3/4] rounded-md overflow-hidden flex items-center justify-center">
            <img src={persona.image} alt={persona.name} className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h3 className="text-white font-semibold text-lg leading-tight">{persona.name}</h3>

            {/* Personality Badges */}
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

            {/* Biography/Description */}
            <p className="text-zinc-300 text-sm mt-3 leading-relaxed">{persona.biography}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaCard;
