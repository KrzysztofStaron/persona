import ChatWithAll from "@/components/custom/ChatWithAll";
import PersonaGrid from "@/components/custom/PersonaGrid";
import { PersonaProvider } from "@/contexts/PersonaContext";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      <div className="relative container mx-auto px-6 py-12 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mb-4">
              Persona Gallery
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Explore diverse AI personalities and engage in meaningful conversations. Each persona brings unique
              perspectives and characteristics to life.
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1 max-w-32"></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-zinc-300 font-medium">AI Powered</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1 max-w-32"></div>
          </div>
        </div>

        <PersonaProvider>
          {/* Persona Grid Section */}
          <div className="mb-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Meet the Personas</h2>
              <p className="text-zinc-400 text-lg">
                Discover unique AI personalities, each with their own traits, backgrounds, and conversation styles.
              </p>
            </div>

            <div className="relative">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-zinc-800 p-8">
                <PersonaGrid />
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Interactive Conversations</h2>
              <p className="text-zinc-400 text-lg">
                Engage with all personas simultaneously and compare their unique perspectives on any topic.
              </p>
            </div>

            <div className="relative">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-zinc-800 p-8">
                <ChatWithAll />
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="text-center pt-16 border-t border-zinc-800">
            <div className="mb-6">
              <p className="text-zinc-500 text-sm">Built with Next.js, React, and powered by advanced AI models</p>
            </div>
            <div className="flex items-center justify-center gap-8 text-zinc-600">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <span className="text-xs">Dynamic Personas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <span className="text-xs">Real-time Chat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <span className="text-xs">AI Generated</span>
              </div>
            </div>
          </div>
        </PersonaProvider>
      </div>
    </div>
  );
}
