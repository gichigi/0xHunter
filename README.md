# 0xHunter

An AI-powered blockchain search tool for Ethereum. Query on-chain data using natural language.

## Overview

0xHunter uses OpenAI to understand natural language queries about blockchain data and fetches real-time information from Ethereum using the Alchemy SDK. Ask questions like "How much ETH does 0x... have?" and get concise, AI-generated text responses with wallet analysis, token holdings, and transaction insights.

## Features

- **Natural Language Queries**: Ask questions about blockchain data in plain English
- **AI-Powered Analysis**: OpenAI GPT-4o-mini understands your intent and plans API calls
- **Scope-Based Optimization**: Automatically optimizes API calls (minimal/standard/full) based on query complexity
- **Wallet Analysis**: Get ETH balance, transaction count, token holdings, and NFT collections
- **Token Insights**: Analyze token metadata, balances, and transfers
- **Concise Text Responses**: AI-generated markdown responses in "0xHunter" brand voice
- **Shareable Results**: Results stored in URL params - share, bookmark, or save links
- **Dark Theme UI**: Atmospheric interface matching "0xHunter" aesthetic

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI SDK (@ai-sdk/openai)
- **Blockchain**: Alchemy SDK
- **Price Data**: CoinGecko API (token metadata, logos, current prices)
- **Token Holders**: Etherscan API (top holders, total supply)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ (or use pnpm)
- An OpenAI API key
- An Alchemy API key ([Get one here](https://www.alchemy.com/))
- A CoinGecko API key (optional, for token metadata) ([Get one here](https://www.coingecko.com/en/api))
- An Etherscan API key (optional, for token holder queries) ([Get one here](https://etherscan.io/apis))

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
ETHERSCAN_API_KEY=your_etherscan_api_key_here  # Optional, for token holder queries
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a natural language query about Ethereum addresses, tokens, or transactions
2. The AI agent analyzes your query, determines intent, and selects optimal scope (minimal/standard/full)
3. Relevant blockchain data is fetched from Alchemy based on query complexity
4. Results are displayed as concise, AI-generated text responses in markdown format
5. Share results via URL - all data is stored in query parameters for easy sharing

### Example Queries

- `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- `How much ETH does 0x8133a5dcba30387e88b8dd3b782797ae00defcc0 have?`
- `Show me token balances for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- `Analyze this wallet: 0x8133a5dcba30387e88b8dd3b782797ae00defcc0`

## Project Structure

```
0xHunter/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── search/        # Main search endpoint
│   ├── page.tsx           # Home page
│   └── results/           # Results page
├── components/            # React components
├── lib/                   # Core libraries
│   └── ai-agent.ts       # AI agent logic
├── utils/                 # Utilities
│   ├── alchemy.ts        # Alchemy SDK setup
│   └── coingecko.ts      # CoinGecko API integration (token metadata)
└── package.json
```

## API Routes

- `POST /api/search` - Main search endpoint that processes natural language queries

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
