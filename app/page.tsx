import PersonaGrid from "@/components/custom/PersonaGrid";

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Persona Gallery</h1>
        <p className="text-zinc-400">Explore different personalities and their unique characteristics</p>
      </div>
      <PersonaGrid />
    </div>
  );
}
