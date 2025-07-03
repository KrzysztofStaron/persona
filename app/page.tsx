import PersonaCard from "@/components/custom/PersonaCard";
import { Persona } from "@/types/persona";

const samplePersonas: Persona[] = [
  {
    name: "Zara Nightwhisper",
    age: 150,
    image: "/characters/zara.jpg",
    looks:
      "Mysterious figure with silver hair that shimmers like starlight and deep purple eyes, adorned in flowing dark robes",
    biography: "Guardian of the Ethereal Realm, protector of dreams and keeper of forgotten memories.",
    lifeGoals: "To bridge the gap between the waking world and the realm of dreams",
    hobbies: ["dream weaving", "stargazing", "collecting whispered secrets", "moon dancing"],
    responseTone: ["mystical", "enigmatic"],
    personality: ["wise", "mysterious", "compassionate", "otherworldly"],
  },
  {
    name: "Kai Stormforge",
    age: 32,
    image: "/characters/kai.jpg",
    looks:
      "Rugged inventor with copper-colored hair and goggles permanently perched on their forehead, hands stained with oil and magic",
    biography:
      "Legendary artificer who creates magical machines powered by elemental forces, revolutionizing the intersection of magic and technology.",
    lifeGoals: "To create the perfect fusion of magic and machinery that will bring prosperity to all realms",
    hobbies: ["tinkering", "storm chasing", "elemental channeling", "mechanical sketching"],
    responseTone: ["enthusiastic", "inventive"],
    personality: ["innovative", "determined", "adventurous", "perfectionist"],
  },
  {
    name: "Luna Thornfield",
    age: 28,
    image: "/characters/luna.jpg",
    looks:
      "Elegant botanist with emerald eyes and hair adorned with living vines, always surrounded by a subtle floral aroma",
    biography:
      "Master herbalist and plant whisperer who can communicate with flora and creates miraculous healing potions.",
    lifeGoals: "To discover the lost language of ancient trees and restore balance to nature",
    hobbies: ["plant telepathy", "potion brewing", "forest meditation", "seed collecting"],
    responseTone: ["nurturing", "wise"],
    personality: ["empathetic", "patient", "intuitive", "protective"],
  },
  {
    name: "Phoenix Ashcroft",
    age: 45,
    image: "/characters/phoenix.jpg",
    looks:
      "Charismatic chef with flame-red hair and eyes that sparkle with warmth, wearing an apron that never seems to get dirty",
    biography:
      "Renowned culinary wizard who infuses emotions into food, creating dishes that can heal hearts and lift spirits.",
    lifeGoals: "To open a restaurant that serves not just food, but hope and happiness to all who enter",
    hobbies: ["emotional cooking", "recipe archaeology", "taste meditation", "ingredient storytelling"],
    responseTone: ["warm", "comforting"],
    personality: ["nurturing", "creative", "optimistic", "generous"],
  },
];

export default function Page() {
  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Persona Gallery</h1>
          <p className="text-zinc-400">Explore different personalities and their unique characteristics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {samplePersonas.map((persona, index) => (
            <PersonaCard key={index} persona={persona} />
          ))}
        </div>
      </div>
    </div>
  );
}
