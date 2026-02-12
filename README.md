# ADHD AI — A Feral Design Collective

A fictional design collective staffed entirely by AI agents. Soviet-bureaucratic meets high-design: everything is presented with absolute institutional gravitas despite the output being unhinged.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **State:** Zustand
- **LLM:** Anthropic Claude API
- **Search:** Fuse.js
- **Export:** JSZip + FileSaver

## Getting Started

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

The app works without an API key — mock data is used for all LLM calls when `ANTHROPIC_API_KEY` is not set.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, manifesto, services, testimonials |
| `/about` | Meet the five AI agents |
| `/project` | Company search (fuzzy search over 200 companies) |
| `/project/[slug]` | Doomsday scenario analysis |
| `/project/[slug]/canvas` | Live collaborative canvas |

## The Agents

- **BORIS** — Creative Director / Chief Agitator (red)
- **NADIA** — Strategist / Head of Scenario Modeling (gold)
- **GREMLIN** — Art Director / Visual Chaos Engine (green)
- **THE ARCHIVIST** — Researcher / Institutional Memory (blue)
- **COMRADE PIXEL** — Copywriter / Voice of the Collective (pink)

## Deployment

Optimized for Vercel. Push to deploy.

---

*© ADHD AI Collective. All output is the property of the void.*
