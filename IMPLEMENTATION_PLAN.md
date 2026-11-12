# Wokvi - Implementation Plan

## Project Overview
Building an AI-powered code builder, simulator, and builder platform (Wokvi) similar to blueprint.io, schematik.io, and wokwi.com.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Monaco Editor + Three.js + Canvas 2D
- **Simulator Core**: Rust → WASM (AVR, ESP32, RP2040, STM32)
- **AI Pipeline**: Cloud LLM + local embeddings for RAG
- **Backend**: Node.js (Fastify) + PostgreSQL + Redis
- **Infrastructure**: Vercel (frontend), Fly.io (backend), Cloudflare R2 (assets)

## Phase 1: Foundation (Months 1-2)

### Week 1-2: Project Setup & Core Infrastructure
- [ ] Initialize monorepo with Turborepo/pnpm workspaces
- [ ] Set up React 18 + TypeScript + Vite frontend
- [ ] Configure ESLint, Prettier, TypeScript strict mode
- [ ] Set up Monaco Editor for code editing
- [ ] Configure Three.js for 3D view
- [ ] Set up Canvas 2D for schematic/breadboard rendering
- [ ] Configure Yjs for real-time collaboration
- [ ] Set up Fastify backend with TypeScript
- [ ] Configure PostgreSQL + Prisma ORM
- [ ] Set up Redis for caching/sessions
- [ ] Configure authentication (Clerk/Auth.js)
- [ ] Set up CI/CD (GitHub Actions)

### Week 3-4: WASM Simulator Core (Rust)
- [ ] Set up Rust workspace with wasm32-wasip1 target
- [ ] Implement AVR core (ATmega328P) - CPU, memory, GPIO
- [ ] Implement basic peripherals: UART, Timers, Interrupts
- [ ] Build WASM module with wasm-bindgen
- [ ] Create TypeScript bindings for WASM
- [ ] Benchmark: CoreMark, Dhrystone vs native
- [ ] Target: ≥80% native speed

### Week 5-6: AI Project Generator Pipeline
- [ ] Design prompt engineering for schematic generation
- [ ] Build RAG system with component datasheets
- [ ] Create firmware generation templates (Arduino, ESP-IDF)
- [ ] Implement project export to PlatformIO format
- [ ] Test with 50+ project descriptions
- [ ] Target: >90% electrically correct schematics

### Week 7-8: Component Library & Smart Wiring
- [ ] Design component data model (JSON schema)
- [ ] Build 300+ component definitions with parametric footprints
- [ ] Implement pin mapping system
- [ ] Create auto-routing for breadboard wires
- [ ] Implement DRC for schematic (net labels, power flags)
- [ ] Build component search/filter UI

## Phase 2: Canvas & Simulation (Months 3-4)

### Week 9-10: Unified Digital Twin Canvas
- [ ] Schematic editor (KiCad-style) with Canvas 2D
- [ ] Breadboard view (Fritzing-style) with Canvas 2D
- [ ] Sync engine: edit in one view → update others
- [ ] Implement zoom, pan, selection, multi-select
- [ ] Add grid snap, alignment guides
- [ ] Keyboard shortcuts for power users

### Week 11-12: Extended Simulator Support
- [ ] ESP32 support (Xtensa) - WiFi/BLE virtual radio
- [ ] RP2040 support (ARM Cortex-M0+)
- [ ] Peripheral models: I2C, SPI, ADC, PWM
- [ ] Interrupt system with priority handling
- [ ] Cycle-accurate timing simulation
- [ ] Virtual sensor models (temperature, humidity, motion, etc.)

### Week 13-14: Code Editor Integration
- [ ] Monaco Editor with Arduino/ESP-IDF IntelliSense
- [ ] Live error highlighting (compile errors in editor)
- [ ] Code generation from schematic changes
- [ ] Bidirectional sync: code ↔ schematic ↔ breadboard
- [ ] Terminal output panel
- [ ] Serial monitor simulation

## Phase 3: AI Features & Polish (Months 5-6)

### Week 15-16: AI Debugging Copilot
- [ ] Chat sidebar UI with streaming responses
- [ ] Context injection: schematic + code + sim traces
- [ ] Root cause analysis engine
- [ ] One-click fix application
- [ ] Cross-domain reasoning: schematic ↔ code ↔ timing
- [ ] Feedback loop for improving suggestions

### Week 17-18: Progressive Onboarding
- [ ] Tier 1: Magic Mode - single prompt → generate & run
- [ ] Tier 2: Guided Mode - step-by-step wizard
- [ ] Tier 3: Pro Mode - full canvas access
- [ ] Feature gating system
- [ ] User progression tracking
- [ ] Interactive tutorials

### Week 19-20: Collaboration & Classroom
- [ ] Real-time multiplayer editing (Yjs/CRDT)
- [ ] Shareable simulation links (read-only)
- [ ] Classroom dashboard for educators
- [ ] Assignment creation & auto-grading
- [ ] LMS integration (Google Classroom, Canvas)
- [ ] Student progress tracking

### Week 21-22: Export & CI Integration
- [ ] Export to PlatformIO, Arduino IDE, ESP-IDF
- [ ] GitHub Action for headless simulation
- [ ] Project packaging (ZIP with all files)
- [ ] BOM generation (CSV)
- [ ] Documentation generation

### Week 23-24: Beta Launch Preparation
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG AA)
- [ ] Security review
- [ ] Load testing
- [ ] Documentation site
- [ ] Landing page
- [ ] Beta user onboarding

## Phase 4: v2 Features (Months 7-12)
- STM32 + Zephyr targets
- 3D board/enclosure view
- Advanced debugging (trace, profiling)
- Team workspaces with RBAC
- Enterprise SSO (SAML/OIDC)
- IoT startup templates
- Plugin marketplace foundation

## Key Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WASM simulator performance < 80% native | Medium | High | Early benchmarking; fallback to cloud simulation |
| AI schematic correctness < 90% | Medium | High | Curated test set; human-in-loop validation |
| ESP32 WiFi/BLE licensing issues | Low | High | Legal review early; open-source fallback |
| Component library maintenance burden | High | Medium | Community contributions; automated validation |
| Real-time collaboration complexity | Medium | High | Start simple; Yjs proven at scale |

## Success Metrics (from PRD)
- KR1: Time from prompt to running simulation ≤ 5 minutes (p50)
- KR2: 50,000 WAU by month 6
- KR3: ≥ 95% simulation accuracy on core peripherals
- KR4: ≥ 30% projects start from template
- KR5: 500+ classroom seats by month 9

## Team Structure (Recommended)
- 1 Product Lead
- 1 Engineering Lead
- 2 Frontend Engineers (Canvas, Editor, Collaboration)
- 2 Backend/Rust Engineers (WASM Simulator, AI Pipeline)
- 1 ML/AI Engineer (Prompt Engineering, RAG, Copilot)
- 1 Designer (UX, Onboarding, Accessibility)
- 1 DevOps/Platform Engineer
- 1 Community/Education Lead