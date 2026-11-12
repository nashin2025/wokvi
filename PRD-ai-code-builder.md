# PRD: AI-Powered Code Builder, Simulator, and Builder Platform

---

## 1. Summary

**Wokvi** is an AI-powered platform that turns a natural-language idea into a working embedded prototype in minutes. It unifies schematic capture, breadboard wiring, firmware generation, and multi-architecture simulation (AVR, ESP32, RP2040, STM32) in a single browser-based canvas. Target users are makers, embedded engineers, STEM students, and IoT startups who currently stitch together 4-6 separate tools to go from concept to validated hardware.

---

## 2. Contacts

| Name | Role | Comment |
|------|------|---------|
| Product Lead | Product | Owns scope, priority, and release decisions |
| Engineering Lead | Engineering | Architecture, WASM simulator core, AI pipeline |
| Design Lead | Design | Canvas UX, progressive onboarding, accessibility |
| Community Lead | GTM | Maker/education outreach, template library |

---

## 3. Background

### Context
Today, building an embedded project requires juggling: Fritzing/Tinkercad for wiring, VS Code/PlatformIO for code, Wokwi/SimulIDE for simulation, and datasheets for component selection. Each tool has its own file format, mental model, and learning curve. AI code assistants (GitHub Copilot, Cursor) generate snippets but cannot validate hardware behavior.

### Why Now
- **LLMs + WASM** make it possible to generate, compile, and simulate firmware entirely in-browser with near-native speed.
- **Wokwi's success** (100K+ monthly active users) proves browser-based embedded simulation is viable and loved.
- **Education shift**: Schools and bootcamps need zero-install, collaborative tools for remote/hybrid labs.
- **IoT talent gap**: Teams need faster iteration to ship hardware products; "idea-to-prototype in minutes" is a genuine differentiator.

---

## 4. Objective & Key Results

**Objective**: Enable any user to go from a plain-English description to a simulated, validated embedded prototype in under 5 minutes, across the four target segments.

**Alignment**: Supports company vision "Democratize hardware creation" and strategy "AI-first developer tools for physical computing."

### Key Results (SMART)

| # | Key Result | Target | Measurement |
|---|------------|--------|-------------|
| KR1 | Time from prompt to running simulation | ≤ 5 minutes (p50) | Telemetry: prompt-submit → first sim frame |
| KR2 | Weekly active users (WAU) across all segments | 50,000 by month 6 | Analytics: unique users with ≥1 sim run/week |
| KR3 | Simulation accuracy vs. hardware | ≥ 95% parity on core peripherals (GPIO, UART, I2C, SPI, ADC, PWM, WiFi/BLE stack) | Automated regression suite vs. physical dev boards |
| KR4 | Template/library adoption | ≥ 30% of projects start from a template | Telemetry: template clone → first edit |
| KR5 | Education seat licenses | 500+ classroom seats by month 9 | CRM: signed education agreements |

---

## 5. Market Segments

| Segment | Description | Primary Job-to-Be-Done | Constraints |
|---------|-------------|------------------------|-------------|
| **Makers/Hobbyists** | Arduino/ESP32 enthusiasts building weekend projects, home automation, robotics | "Get my custom gadget working without fighting toolchains" | Zero budget tolerance; needs instant gratification; prefers visual over code |
| **Embedded Engineers** | Professional firmware/IoT developers validating peripherals, protocols, RTOS behavior before hardware arrives | "Verify my firmware logic on realistic hardware models without waiting for PCBs" | Needs accuracy, CI integration, version control, team collaboration |
| **Students/Educators** | High-school/college STEM labs, bootcamps, self-learners | "Learn electronics and coding visually without broken wires or driver issues" | Zero-install mandatory; LMS integration; classroom management; COPPA/FERPA |
| **IoT Startups** | Early-stage hardware teams iterating on product concepts, demos for investors | "Show a working prototype to stakeholders this week, not this quarter" | Needs export to production toolchains; BOM generation; regulatory-aware components |

**Focus for v1**: Makers, Embedded Engineers, Students (IoT Startups served via export/pro features in v2).

---

## 6. Value Propositions (6-part JTBD per Segment)

### 6.1 Makers/Hobbyists
| Part | Statement |
|------|-----------|
| **Who** | Weekend makers building Arduino/ESP32 projects |
| **Why** | They have an idea but get stuck wiring breadboards, debugging C++, and flashing boards |
| **What before** | Fritzing for wiring → Arduino IDE for code → Wokwi for sim → physical board for test. Each context switch loses 15-30 min. |
| **How** | One canvas: type "weather station with BME280 and OLED" → AI generates schematic, firmware, and simulation. Click "Run" → see live sensor data on virtual display. |
| **What after** | Working prototype in 3 minutes. Can iterate: "add WiFi and push to MQTT" → instant update. Export to PlatformIO for real hardware. |
| **Alternatives** | Tinkercad (sim only, no AI), Wokwi (sim only, manual code), Copilot (code only, no hardware validation) |
| **Value Prop** | "The only tool that turns your project idea into a running, debuggable virtual device in one click — no context switching, no toolchain setup." |

### 6.2 Embedded Engineers
| Part | Statement |
|------|-----------|
| **Who** | Professional firmware engineers developing IoT products |
| **Why** | Hardware bring-up delays firmware validation; CI pipelines can't test hardware-in-loop |
| **What before** | Write code in VS Code → compile with PlatformIO → flash dev board → debug with JTAG/logger. Hardware bugs found late. |
| **How** | Import existing PlatformIO project → simulate in browser with cycle-accurate peripheral models → CI gate runs simulation headless → catch race conditions, timing bugs, protocol errors before PCB arrives. |
| **What after** | 80% of bring-up bugs caught in sim. CI passes → confident hardware bring-up. Team shares sim links for code review. |
| **Alternatives** | Renode/QEMU (steep learning curve, no visual canvas), hardware-in-loop rigs (expensive, slow), Wokwi CLI (limited peripheral models) |
| **Value Prop** | "Production-grade simulation that fits in your CI pipeline — catch hardware bugs before you order PCBs." |

### 6.3 Students/Educators
| Part | Statement |
|------|-----------|
| **Who** | STEM teachers and students in classrooms, bootcamps, remote learning |
| **Why** | Physical labs break: loose wires, blown components, driver conflicts, no hardware at home |
| **What before** | Tinkercad Circuits (limited components, no code gen), Arduino Cloud (paid, limited sim), physical kits (cost, logistics) |
| **How** | Teacher creates assignment "Build a traffic light with pedestrian button" → students open link → AI guides them: schematic → code blocks → simulation. Auto-graded: sim must show correct sequence. |
| **What after** | Every student has a working virtual lab. Zero install. Teacher sees dashboard: who's stuck, who finished. LMS grade sync. |
| **Alternatives** | Tinkercad (no AI guidance, limited grading), physical kits ($50/student, broken parts), PhET sims (not embedded) |
| **Value Prop** | "A virtual electronics lab that never breaks, grades itself, and works on a Chromebook — so every student succeeds." |

---

## 7. Solution

### 7.1 UX / Key Flows
- **Magic Mode (Tier 1)**: Single prompt box → "Generate & Run" → live simulation. Zero configuration.
- **Guided Mode (Tier 2)**: Step-by-step wizard: choose board → pick sensors/actuators → AI suggests wiring → generate code blocks → simulate.
- **Pro Mode (Tier 3)**: Full canvas: schematic editor, breadboard view, 3D board view, code editor (Monaco), debug panel, terminal. All views synced.

*Wireframes: [Figma link TBD]*

### 7.2 Key Features (v1 Must-Haves)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **AI Project Generator** | Natural language → schematic + firmware + sim config. Uses RAG over component datasheets, Arduino/ESP-IDF/Zephyr examples. Outputs PlatformIO-compatible project. |
| 2 | **Unified Digital Twin Canvas** | Three synced views: Schematic (KiCad-style), Breadboard (Fritzing-style), 3D Board (PCB + enclosure preview). Edit in any view → others update instantly. |
| 3 | **WASM Multi-Arch Simulator Core** | Rust → WASM compilation of: AVR (ATmega328P), ESP32 (Xtensa), RP2040 (ARM Cortex-M0+), STM32 (Cortex-M4). Cycle-accurate GPIO, UART, I2C, SPI, ADC, PWM, timers, interrupts. WiFi/BLE stack simulated via virtual radio. |
| 4 | **AI Debugging Copilot** | Chat sidebar: "Why is my I2C scan empty?" → analyzes schematic + code + sim trace → root cause: "Pull-ups missing on SDA/SCL (add 4.7kΩ)" with one-click fix. Cross-domain: schematic ↔ code ↔ timing. |
| 5 | **Progressive Onboarding Ramp** | Tier 1: Magic (prompt only). Tier 2: Guided (wizard + code blocks). Tier 3: Pro (full IDE). User graduates by unlocking features; never forced back. |
| 6 | **Component Library & Smart Wiring** | 500+ parts with parametric footprints, pin mappings, simulation models. Auto-route breadboard wires; DRC for schematic (net labels, power flags). |
| 7 | **Project Export & CI Integration** | One-click export to PlatformIO, Arduino IDE, Zephyr, ESP-IDF. GitHub Action for headless simulation in CI. |
| 8 | **Collaboration & Sharing** | Real-time multiplayer editing (Yjs/CRDT). Share sim link (read-only) for design reviews. Classroom dashboard for educators. |

### 7.3 Technology

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 18 + TypeScript + Monaco Editor + Three.js (3D) + Canvas 2D (schematic/breadboard) | Mature ecosystem, WASM interop, collaborative editing via Yjs |
| Simulator Core | Rust → WASM (wasm32-wasip1) | Near-native speed, memory safety, existing HAL crates (esp-hal, rp-hal, stm32-hal) |
| AI Pipeline | Cloud LLM (Claude/GPT-4o) + local embedding (sentence-transformers) for RAG | Best code gen quality; local embeddings for privacy/fast retrieval |
| Backend | Node.js (Fastify) + PostgreSQL + Redis | Auth, project storage, real-time sync, CI webhook handling |
| Infrastructure | Vercel (frontend), Fly.io (backend WASM workers), Cloudflare R2 (assets) | Global edge, WASM support, cost-effective scaling |

### 7.4 Assumptions & Open Questions

| # | Assumption / Question | Validation Plan |
|---|----------------------|-----------------|
| A1 | WASM simulator reaches ≥80% native speed for typical firmware | Benchmark CoreMark, Dhrystone, and real sketches vs. native QEMU/Renode |
| A2 | AI-generated schematics are >90% electrically correct on first try | Curated test set of 200 project descriptions → schematic review by EE |
| A3 | Makers will trust AI wiring without manual verification | Usability study: 20 makers build 3 projects each; measure manual edits |
| A4 | Schools will adopt browser-only tool over Tinkercad | Pilot with 3 teachers, 100 students; measure completion rates |
| Q1 | Licensing for proprietary silicon models (ESP32 WiFi/BLE stack) | Legal review; fallback: open-source stack (esp-wifi-rs) with reduced fidelity |
| Q2 | Monetization: freemium vs. seat licenses vs. compute credits | Test pricing page variants; target $15/mo pro, $5/seat education |

---

## 8. Release Plan

### v1 (Months 1-6) — "Magic to Pro"
**Scope**: AI Project Generator (Tier 1/2), Unified Canvas (Schematic + Breadboard), WASM Simulator (AVR + ESP32 + RP2040 core peripherals), AI Debugging Copilot (chat + one-click fixes), Progressive Onboarding, Component Library (300 parts), Export to PlatformIO/Arduino, Real-time collaboration, Classroom dashboard.

**Non-Goals**: STM32/Zephyr support, 3D board view, BOM generation, CI GitHub Action, mobile app, offline mode, plugin marketplace, enterprise SSO.

### v2 (Months 7-12) — "Production Ready"
**Add**: STM32 + Zephyr targets, 3D board/enclosure view, BOM export (CSV, KiCad), GitHub Action for headless sim, advanced debugging (trace, profiling), team workspaces with RBAC, enterprise SSO (SAML/OIDC), IoT startup templates (cellular, LoRa, Matter).

### v3 (Year 2) — "Platform"
**Add**: Plugin marketplace (community peripheral models), AI-assisted PCB layout (auto-place/route), hardware-in-loop gateway (real board ↔ sim sync), federated simulation (multi-device networks), marketplace for project templates/components.

### Timeline Estimate
- **Months 1-2**: Core team hiring, WASM simulator PoC (AVR + GPIO/UART), AI prompt→code pipeline
- **Months 3-4**: Canvas (schematic + breadboard), component library, ESP32/RP2040 sim
- **Months 5-6**: AI Debugging Copilot, progressive onboarding, collaboration, classroom dashboard, beta launch
- **Month 6+**: v1 GA, v2 planning

---

*Document version: 1.0 | Author: Product Lead | Date: 2026-11-12*