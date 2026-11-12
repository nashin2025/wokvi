# Wokvi - AI-Powered Embedded Development Platform

> Build embedded projects in minutes, not hours. From natural language to running simulation.

Wokvi is an AI-powered platform that unifies schematic capture, breadboard wiring, firmware generation, and multi-architecture simulation (AVR, ESP32, RP2040, STM32) in a single browser-based canvas.

## Features

- **AI Project Generator**: Describe your project in plain English → get schematic, firmware, and simulation instantly
- **Three Modes**: Magic (AI-only), Guided (step-by-step), Pro (full control)
- **Multi-Architecture Simulation**: AVR (ATmega328P), ESP32, RP2040, STM32 - all in WASM
- **Unified Canvas**: Schematic, Breadboard, 3D Board, and Code views - all synced
- **AI Debugging Copilot**: Chat with AI about your circuit, code, and simulation state
- **Real-time Collaboration**: Multiplayer editing with Yjs/CRDT
- **Classroom Ready**: Assignments, auto-grading, LMS integration
- **Export & CI**: PlatformIO, Arduino IDE, ESP-IDF, GitHub Actions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Monaco Editor + Three.js + Canvas 2D |
| Simulator Core | Rust → WASM (avr-hal, esp-hal, rp2040-hal) |
| AI Pipeline | Cloud LLM (Claude/GPT-4o) + Local embeddings (RAG) |
| Backend | Node.js (Fastify) + PostgreSQL + Redis |
| Infrastructure | Vercel (frontend), Fly.io (backend), Cloudflare R2 (assets) |

## Project Structure

```
wokvi/
├── packages/
│   ├── frontend/          # React application
│   ├── backend/           # Fastify API server
│   ├── simulator-core/    # Rust WASM simulator
│   ├── shared/            # Shared TypeScript types
│   └── components/        # Shared UI components
├── turbo.json             # Turborepo config
├── pnpm-workspace.yaml    # pnpm workspaces
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust 1.75+ (for simulator-core)
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start development servers
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database Studio: `pnpm db:studio`

## Development Commands

```bash
# Run all dev servers
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Run tests
pnpm test

# Format code
pnpm format
```

## Simulator Core (Rust/WASM)

```bash
cd packages/simulator-core

# Build for WASM
cargo build --target wasm32-wasip1 --release

# Run tests
cargo test

# Check WASM size
wasm-objdump -h target/wasm32-wasip1/release/wokvi_simulator_core.wasm
```

## Architecture

### Frontend (packages/frontend)
- **React 18** with TypeScript
- **Vite** for fast HMR
- **Monaco Editor** for code editing
- **Three.js** for 3D board view
- **Canvas 2D** for schematic/breadboard
- **Yjs** for real-time collaboration
- **Zustand** for state management
- **Tailwind CSS** for styling

### Backend (packages/backend)
- **Fastify** for high-performance API
- **Prisma** ORM with PostgreSQL
- **Redis** for caching/sessions
- **JWT** authentication
- **WebSocket** for real-time simulation

### Simulator Core (packages/simulator-core)
- **Rust** compiled to WebAssembly
- **Multi-architecture**: AVR, ESP32, RP2040, STM32
- **Peripherals**: GPIO, UART, I2C, SPI, ADC, PWM, Timer
- **WiFi/BLE** simulation for ESP32
- **PIO** simulation for RP2040

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Current user
- `PATCH /api/v1/auth/preferences` - Update preferences

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/fork` - Fork project

### Components
- `GET /api/v1/components` - List components
- `GET /api/v1/components/:id` - Get component

### Classrooms
- `GET /api/v1/classrooms` - List classrooms
- `POST /api/v1/classrooms` - Create classroom
- `POST /api/v1/classrooms/:id/join` - Join classroom
- `POST /api/v1/classrooms/:id/assignments` - Create assignment

### Simulation
- `POST /api/v1/simulation/sessions` - Start simulation
- `GET /api/v1/simulation/sessions/:id` - Get session
- `WS /api/v1/simulation/ws` - Real-time simulation

### AI
- `POST /api/v1/ai/generate` - Generate project from prompt
- `POST /api/v1/ai/chat` - AI debugging chat
- `POST /api/v1/ai/analyze/schematic` - Analyze schematic
- `POST /api/v1/ai/suggest/components` - Suggest components

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/wokvi
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a PR

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] v1: Core features (Magic/Guided/Pro modes, simulation, AI)
- [ ] v2: STM32/Zephyr, 3D view, BOM export, CI integration
- [ ] v3: Plugin marketplace, AI PCB layout, hardware-in-loop