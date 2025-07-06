# Persona Chat Application

A Next.js application that allows users to chat with AI-powered personas, each with unique personalities and dynamically generated avatars.

## Features

- **Dynamic Persona Generation**: Personas are generated using Google AI Studio via OpenRouter with unique personalities, backgrounds, and characteristics
- **AI-Generated Avatars**: Each persona gets a unique avatar generated using OpenAI's DALL-E 2 API based on their physical description
- **Interactive Chat**: Chat with each persona using Google AI Studio via OpenRouter with real-time streaming responses
- **Development Caching**: In development mode, personas and avatars are cached locally for 24 hours to save API costs
- **Debug Tools**: Development debug panel with options to regenerate personas/avatars and clear cache
- **Dark Mode UI**: Beautiful dark-themed interface built with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your API keys:

   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run the development server**:

   ```bash
   pnpm build
   pnpm start
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000` to see the application.

## How It Works

### Persona Generation

- On first load, 4 unique personas are generated using Google's Gemini Flash 1.5 via OpenRouter
- Each persona has unique characteristics: name, age, appearance, personality traits, hobbies, and background
- In development mode, generated personas are cached locally for 24 hours

### Avatar Generation

- All 4 personas simultaneously generate avatars using OpenAI's DALL-E 2 API
- Avatars are created at 256x256 resolution, optimized for small display sizes
- Generated avatars are cached with their respective personas

### Development Features

- **Local Caching**: Personas and avatars are cached in localStorage for 24 hours
- **Debug Panel**: Fixed bottom-right debug button (development only) with options to:
  - 🔄 Regenerate all personas and avatars
  - 🗑️ Clear cache and reload
- **Cache Status**: Display shows when using cached data and expiration time

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **AI Integration**: Google AI Studio via OpenRouter for persona generation & chat, OpenAI DALL-E 2 for avatar generation
- **Package Manager**: pnpm

## Project Structure

```
/app
  /actions          # Server actions for OpenAI integration
    - generatePersonas.ts      # Dynamic persona generation (Google AI Studio)
    - generateAvatar.ts        # Avatar generation (OpenAI DALL-E)
    - generateAllAvatars.ts    # Batch avatar generation (OpenAI DALL-E)
    - chatWithPersona.ts       # Chat functionality (Google AI Studio)
    - chatWithPersonaStream.ts # Streaming chat functionality (Google AI Studio)
/components
  /custom          # Custom components
    - PersonaGallery.tsx       # Main gallery with caching
    - PersonaCard.tsx          # Individual persona cards
    - PersonaChat.tsx          # Chat interface
    - DebugButton.tsx          # Development debug tools
  /ui              # Reusable UI components
/lib               # Utilities and custom hooks
  - devCache.ts              # Development caching system
/types             # TypeScript type definitions
```

## Development Mode

When running on localhost, the application automatically enables:

- **Caching**: Personas and avatars cached for 24 hours
- **Debug Tools**: Debug panel in bottom-right corner
- **Console Logging**: Cache operations logged to console

## API Costs

- **Persona Generation**: Uses Google Gemini Flash 1.5 via OpenRouter (~$0.0004 for 4 personas)
- **Avatar Generation**: Uses DALL-E 2 (256x256) (~$0.064 for 4 avatars)
- **Chat**: Uses Google Gemini Flash 1.5 via OpenRouter (~$0.00015 per 1K tokens)
- **Total First Load**: ~$0.065 for 4 personas with avatars
- **Development**: Cached for 24 hours to minimize API calls

## Production vs Development

**Development Mode** (localhost):

- Personas and avatars cached locally
- Debug panel available
- Console logging enabled

**Production Mode**:

- Fresh generation on each deployment
- No caching (relies on server-side optimization)
- Debug panel hidden

## Customization

You can add new personas by editing `lib/samplePersonas.ts`. Each persona should have:

- `name`: Character name
- `age`: Character age
- `looks`: Physical description (used for avatar generation)
- `biography`: Character background
- `personality`: Array of personality traits
- `hobbies`: Array of hobbies
- `responseTone`: How the character responds
- `lifeGoals`: Character's objectives
- `image`: Leave empty for AI generation or provide a static image URL

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
