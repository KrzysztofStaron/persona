"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Brain,
  Users,
  Sparkles,
  Shield,
  Heart,
  BookOpen,
  Palette,
  ArrowRight,
  Play,
  Zap,
  ChevronRight,
  Hammer,
  Github,
  Rocket,
} from "lucide-react";

const personas = [
  {
    id: 1,
    name: "Luna",
    role: "Empathetic Healer",
    traits: ["Empathetic", "Intuitive", "Protective"],
    description: "Master herbalist who communicates with flora and creates miraculous healing potions.",
    icon: Heart,
  },
  {
    id: 2,
    name: "Echo",
    role: "Wandering Bard",
    traits: ["Artistic", "Gentle", "Wise"],
    description: "Whose melodies can heal trauma, inspire courage, or bring peace to troubled souls.",
    icon: BookOpen,
  },
  {
    id: 3,
    name: "Phoenix",
    role: "Culinary Wizard",
    traits: ["Creative", "Generous", "Optimistic"],
    description: "Infuses emotions into food, creating dishes that can heal hearts and lift spirits.",
    icon: Zap,
  },
];

export default function Home() {
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center relative">
                <Hammer className="w-5 h-5 text-black" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-heading font-bold text-orange-500">PersonaForge</span>
                <div className="text-xs text-gray-400 -mt-1">Open Source</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/KrzysztofStaron/persona" target="_blank">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </a>

              <Button
                size="sm"
                className="bg-orange-500 text-black hover:bg-orange-600"
                onClick={() => router.push("/app")}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 relative">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-white">Free & Open Source</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">20 Creative AI Minds</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-8">
            <span className="text-white">Force AI to Be</span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-white bg-clip-text text-transparent">
              Wildly Creative
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get unique AI characters ready to respond to your ideas instantly. Push LLMs beyond their comfort zone and
            watch them create diverse, unexpected perspectives you've never seen before.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-orange-500 text-black hover:bg-orange-600 px-8 py-4 text-lg font-semibold"
              onClick={() => router.push("/app")}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Get Creative Minds
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-zinc-700 hover:bg-zinc-900 hover:border-white text-white bg-transparent"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Interactive Persona Preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {personas.map(persona => (
              <Card
                key={persona.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 bg-zinc-900/50 backdrop-blur-sm ${
                  activePersona === persona.id
                    ? "border-orange-500 shadow-lg shadow-orange-500/20 scale-105"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
                onClick={() => setActivePersona(activePersona === persona.id ? null : persona.id)}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                    <persona.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-white">{persona.name}</h3>
                  <p className="text-sm text-orange-500 mb-3">{persona.role}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {persona.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full text-zinc-300"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                  {activePersona === persona.id && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-sm text-zinc-400">{persona.description}</p>
                      <Button size="sm" className="w-full bg-orange-500 text-black hover:bg-orange-600">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat with {persona.name}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Open Source Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
              <Github className="w-4 h-4" />
              <span>100% Open Source • MIT License • Community Driven</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-zinc-800 bg-zinc-900/20 py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-6 text-white">How It Forces Creativity</h2>
            <p className="text-xl text-zinc-400">Simple process - unleash creative minds to respond to your ideas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:border-orange-500 transition-colors">
                <Brain className="w-8 h-8 text-white group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">1. Enter Your Idea</h3>
              <p className="text-zinc-400">
                Type anything - a question, problem, creative challenge, or wild concept. The weirder, the better.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:border-orange-500 transition-colors">
                <Users className="w-8 h-8 text-white group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">2. Minds Respond</h3>
              <p className="text-zinc-400">
                Watch as unique AI characters with completely different personalities tackle your idea from every angle
                imaginable.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:border-orange-500 transition-colors">
                <Sparkles className="w-8 h-8 text-white group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">3. Get Amazed</h3>
              <p className="text-zinc-400">
                Discover perspectives you never considered. Each character brings unique creativity that pushes AI
                beyond basic responses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-6 text-white">Why This Changes Everything</h2>
            <p className="text-xl text-zinc-400">
              Stop getting boring, predictable AI responses. Force creativity with unique perspectives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">20 Creative Minds</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Get instant responses from completely different AI personalities. Each one tackles your ideas from
                  unique angles you never considered.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Brain className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Diverse Perspectives</h3>
                <p className="text-zinc-400 leading-relaxed">
                  From analytical thinkers to wild dreamers, creative rebels to logical strategists - watch AI break
                  free from single-minded responses.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Github className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Open Source Power</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Free forever, community-driven development, and fully customizable. Fork it, modify it, make it yours.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Shield className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Privacy First</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Your conversations and characters stay private. No data mining, no tracking, just pure creative
                  freedom.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Users className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Community Driven</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Built by developers, for developers. Join our community of creators pushing the boundaries of AI
                  creativity.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                  <Hammer className="w-6 h-6 text-white group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Forces AI Creativity</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Stop getting generic AI responses. Force LLMs to think outside the box with wildly different creative
                  personalities responding to your ideas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="border-t border-zinc-800 bg-zinc-900/20 py-16 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-heading font-bold mb-4 text-white">Join the Community</h3>
            <p className="text-zinc-400 font-medium mb-8">
              Built by developers, AI enthusiasts, and creative minds worldwide
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-white group-hover:text-orange-500 transition-colors" />
              <div className="text-sm font-medium text-zinc-400">Developers</div>
            </div>
            <div className="text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
              <Users className="w-12 h-12 mx-auto mb-3 text-white group-hover:text-orange-500 transition-colors" />
              <div className="text-sm font-medium text-zinc-400">AI Enthusiasts</div>
            </div>
            <div className="text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
              <Heart className="w-12 h-12 mx-auto mb-3 text-white group-hover:text-orange-500 transition-colors" />
              <div className="text-sm font-medium text-zinc-400">Creators</div>
            </div>
            <div className="text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
              <Palette className="w-12 h-12 mx-auto mb-3 text-white group-hover:text-orange-500 transition-colors" />
              <div className="text-sm font-medium text-zinc-400">Experimenters</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Hammer className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-4xl font-heading font-bold mb-6 text-white">
                Ready to force AI into creative overdrive?
              </h2>
              <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                Stop settling for boring AI responses. Get creative minds ready to blow your mind with their unique
                takes on your ideas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="bg-orange-500 text-black hover:bg-orange-600 px-10 py-4 text-lg font-semibold"
                  onClick={() => router.push("/app")}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <a href="https://github.com/KrzysztofStaron/persona" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-lg border-zinc-700 hover:bg-zinc-900 hover:border-white text-white bg-transparent"
                  >
                    <Github className="w-5 h-5 mr-2" />
                    View on GitHub
                  </Button>
                </a>
              </div>
              <div className="mt-8 text-sm text-zinc-400">
                ✓ Free forever • ✓ No registration required • ✓ MIT License • ✓ Community driven
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-12 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center relative">
                <Hammer className="w-5 h-5 text-black" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div>
                <span className="text-xl font-heading font-bold text-orange-500">PersonaForge</span>
                <div className="text-xs text-zinc-400 -mt-1">Open Source</div>
              </div>
            </div>
            <div className="text-sm text-zinc-400">
              © 2024 PersonaForge. MIT License. Built with ❤️ by the community.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
