# ScrapeDgit - AI-Driven E-commerce Scraping & Recommendation Engine

An AI-powered search engine for Indonesian e-commerce platforms. Describe what you're looking for in natural language, and we'll find and rank the best products across Tokopedia, Shopee, Lazada, Blibli, and Bukalapak.

## Features

- 🤖 **AI-Powered Search**: Natural language query parsing using OpenAI
- 🔍 **Multi-Platform Scraping**: Search across 5 major Indonesian e-commerce sites
- 📊 **Smart Ranking**: Weighted scoring based on price, shipping, ratings, and popularity
- 📍 **Location-Based Shipping**: Estimated shipping costs based on your city
- 📥 **Export Results**: Download results as Excel or CSV
- 🔐 **Authentication**: Email/Password, Google OAuth, and Email OTP
- 💬 **Chat History**: Save and revisit your previous searches

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for caching and rate limiting
- **AI**: OpenAI API for query parsing
- **Scraping**: Puppeteer + Cheerio
- **Auth**: NextAuth.js, JWT, Email OTP

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key
- Gmail SMTP credentials (for OTP)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ScrapeDgit
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Start PostgreSQL and Redis**
```bash
docker-compose up -d
```

5. **Initialize the database**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

6. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_URL` | Application URL |
| `NEXTAUTH_SECRET` | NextAuth secret key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | OpenAI model (default: gpt-4o-mini) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

## Project Structure

```
ScrapeDgit/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── auth/        # Auth pages
│   │   ├── chat/        # Main chat interface
│   │   └── history/     # Chat history
│   ├── components/      # React components
│   │   └── ui/          # UI components
│   └── lib/             # Core libraries
│       ├── auth/        # Authentication utilities
│       ├── llm/         # OpenAI integration
│       ├── scrapers/    # E-commerce scrapers
│       ├── recommendation/ # Scoring engine
│       └── redis/       # Caching & rate limiting
├── docker-compose.yml   # Local development
├── docker-compose.prod.yml # Production
└── Dockerfile           # Production build
```

## Scoring Algorithm

Products are ranked using a weighted scoring algorithm:

| Factor | Weight | Logic |
|--------|--------|-------|
| Price | 50% | Lower price = Higher score |
| Shipping | 25% | Lower estimated shipping = Higher score |
| Times Bought | 15% | Higher sales = Higher score |
| Rating | 10% | Higher rating = Higher score |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/otp/send` - Send OTP email
- `POST /api/auth/otp/verify` - Verify OTP

### Chat
- `POST /api/chat` - Send query and get results
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/[id]` - Get specific chat session
- `DELETE /api/chat/[id]` - Delete chat session

### Export
- `POST /api/export` - Export results as Excel/CSV

## Docker Deployment

### Local Development
```bash
# Start PostgreSQL and Redis only
docker-compose up -d
```

### Production
```bash
# Build and run all services
docker-compose -f docker-compose.prod.yml up -d
```

## Default Accounts

After running the seeder, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@scrapedgit.com | Admin123! | Admin |
| demo@scrapedgit.com | Demo123! | User |

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines first.
