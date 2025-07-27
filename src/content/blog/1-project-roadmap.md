---
title: "Roadmap: building a trading framework in Rust"
description: "Roadmap for project completion"
pubDate: "Jul 27 2025"
---

We’ve divided the project into 5+1 distinct phases. Each phase results in working code, detailed articles, and measurable improvements. The goal is to learn HFT system design by building clean, testable, observable Rust code.

```
┌──────────────┐
│ Phase 1      │  Foundations (Weeks 1–4)
│              │  - Market simulator
│              │  - CI, logging, profiling
└────┬─────────┘
↓
┌────┴─────────┐
│ Phase 2      │  Market data ingestion (Weeks 5–8)
│              │  - Feed abstraction
│              │  - Async pipelines, parsers
└────┬─────────┘
↓
┌────┴─────────┐
│ Phase 3      │  Strategy engine (Weeks 9–12)
│              │  - Event dispatcher
│              │  - Offline backtesting
└────┬─────────┘
↓
┌────┴─────────┐
│ Phase 4      │  Order execution & risk (Weeks 13–16)
│              │  - Local broker simulation
│              │  - Risk hooks
└────┬─────────┘
↓
┌────┴─────────┐
│ Phase 5      │  Infrastructure & observability (Weeks 17–20)
│              │  - Logging, metrics, Docker
└────┬─────────┘
↓
┌────┴─────────┐
│ Phase 6      │  Packaging & release (Weeks 21–24)
│              │  - Crate publishing
│              │  - Final documentation
└──────────────┘
```

Every phase ends with:

- Code in public crates

- Performance benchmarks

- At least one article

- Tests and reproducible builds

Follow along as we build this project week by week, with deep dives into each architectural decision.