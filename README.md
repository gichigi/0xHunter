# 0xHunter

An AI-powered blockchain search tool for Ethereum. Query on-chain data using natural language.

## Overview

0xHunter uses OpenAI to understand natural language queries about blockchain data and fetches real-time information from Ethereum using the Alchemy SDK. Ask questions like "How much ETH does 0x... have?" or "Does 0x... own BAYC?" and get concise, AI-generated text responses with wallet analysis, token holdings, and NFT insights.

## Features

- **Natural Language Queries**: Ask questions about blockchain data in plain English
- **AI-Powered Analysis**: OpenAI GPT-4o-mini understands your intent and plans API calls
- **Address Analysis**: Get ETH balance, transaction count, token holdings, and NFT collections
- **Token Price Queries**: Check current token prices and metadata
- **NFT Collection Queries**: Check if addresses own specific NFT collections (e.g., "Does 0x... own BAYC?")
- **Generic API Access**: Flexible `alchemy_call` method with allowlist for secure, extensible API access
- **Concise Text Responses**: AI-generated markdown responses in "0xHunter" brand voice (dark, mysterious, understated)
- **Shareable Results**: Results stored in URL params - share, bookmark, or save links
- **Dark Theme UI**: Atmospheric interface with Geist Mono font
- **Social Sharing**: Open Graph images for rich link previews

## V1 Scope

**Supported Query Types:**
- **Address Analysis**: Single-address queries for balance, transactions, tokens, and NFTs
- **Token Price**: Current price queries for supported tokens
- **NFT Ownership**: Check if an address owns specific NFT collections

**V1 Limitations:**
- Single-address queries only (no multi-address comparisons)
- Static NFT collection resolution (dynamic lookup deferred to post-V1)
- Limited token set (uses static config with CoinGecko fallback)

See [ROADMAP.md](ROADMAP.md) for full feature list and post-V1 plans.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI SDK (@ai-sdk/openai) with GPT-4o-mini
- **Blockchain**: Alchemy SDK with direct RPC fallback
- **Price Data**: CoinGecko API (token metadata, logos, current prices)
- **Styling**: Tailwind CSS
- **Fonts**: Geist Mono
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ (or use pnpm)
- An OpenAI API key
- An Alchemy API key ([Get one here](https://www.alchemy.com/))
- A CoinGecko API key (optional, for token metadata) ([Get one here](https://www.coingecko.com/en/api))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gichigi/0xHunter.git
cd 0xHunter
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here  # Optional, for token metadata
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a natural language query about Ethereum addresses, tokens, or NFTs
2. The AI agent analyzes your query, determines intent, and plans API calls
3. Relevant blockchain data is fetched from Alchemy
4. Results are displayed as concise, AI-generated text responses in markdown format
5. Share results via URL - all data is stored in query parameters for easy sharing

### Example Queries

**Address Analysis:**
- `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- `Balance of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- `What does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 hold?`
- `Analyze 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`

**Token Price:**
- `Price of UNI`
- `What is UNI worth?`

**NFT Ownership:**
- `Does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 own BAYC?`
- `Does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 own CryptoPunks?`

## Project Structure

```
0xHunter/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── search/        # Main search endpoint
│   ├── page.tsx           # Home page
│   ├── results/           # Results page
│   ├── layout.tsx         # Root layout with metadata
│   └── opengraph-image.tsx # Dynamic OG image generation
├── components/            # React components
│   └── results/           # Result display components
├── lib/                   # Core libraries
│   └── ai-agent.ts        # AI agent query planning
├── utils/                 # Utilities
│   ├── alchemy.ts         # Alchemy SDK setup
│   ├── alchemy-allowlist.ts # Method allowlist for generic calls
│   ├── coingecko.ts       # CoinGecko API integration
│   ├── token-resolver.ts  # Token symbol resolution
│   ├── nft-resolver.ts    # NFT collection resolution
│   └── validation.ts      # Query validation
├── config/                # Static config files
│   ├── tokens.json        # Token address mappings
│   └── nft-collections.json # NFT collection mappings
└── public/                # Static assets
    └── icon.svg           # App icon
```

## API Routes

- `POST /api/search` - Main search endpoint that processes natural language queries
- `GET /opengraph-image` - Dynamic Open Graph image generation for social sharing

## Environment Variables

See `.env.example` for required environment variables.

## Troubleshooting

### Tailwind CSS Not Processing / Styles Not Appearing

**Symptoms:** White background instead of dark theme, CSS file contains `@tailwind` directives instead of utility classes.

**Root Cause:** Tailwind CSS v3.3.0 had a bug where directives weren't being processed. PostCSS config format also matters for Next.js 14.

**Fix:**
1. Upgrade dependencies:
   ```bash
   pnpm install tailwindcss@^3.4.17 postcss@^8.5.6 autoprefixer@^10.4.22
   ```
2. Ensure `postcss.config.js` uses CommonJS format (not `.mjs`):
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```
3. Clear caches and restart:
   ```bash
   rm -rf .next node_modules/.cache
   pnpm dev
   ```

**Prevention:** Use exact versions in `package.json`:
- `tailwindcss: "^3.4.17"` (minimum v3.4 required)
- `postcss: "^8.5.6"` 
- `autoprefixer: "^10.4.22"`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.
