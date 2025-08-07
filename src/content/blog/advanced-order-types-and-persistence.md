---
title: "Advanced Order Types and Event Sourcing"
description: "We extend our basic limit order book to support iceberg and stop-loss orders, and begin designing persistence via event sourcing to prepare the system for production-grade use."
pubDate: "Aug 04 2025"
mindmapBranch: "Components"
difficulty: "advanced"
concepts: ["Advanced Orders", "Event Sourcing", "Persistence", "Order Types"]
tags: ["rust", "hft", "event-sourcing", "order-types", "persistence"]
prerequisites: ["limit-order-book"]
relatedArticles: ["building-limit-order-book"]
seriesOrder: 5
---

# Advanced Order Types and Event Sourcing

In the [previous article](/blog/limit-order-book/), we built a minimal limit order book implementation in Rust. In this article, we’ll take the next step toward a production-ready HFT engine by incorporating more complex order types and adding an event sourcing mechanism to persist the book’s state.

These features are not just bells and whistles—they’re fundamental for real-world trading systems, especially in low-latency environments where auditability, failure recovery, and strategic order masking are essential.

---

## 1. Iceberg Orders

An **iceberg order** is a large order split into smaller visible "child" orders. The main goal is to avoid revealing the full size of the trade to the market.

We’ll represent it in our engine with two properties:

* `total_quantity`: the full size of the order.
* `visible_quantity`: the amount currently shown in the book.

Each time a visible portion is filled, the engine will automatically reinsert a new visible order until the total quantity is depleted.

```rust
#[derive(Debug, Clone)]
pub struct IcebergOrder {
    pub id: OrderId,
    pub side: Side,
    pub price: Price,
    pub total_quantity: Quantity,
    pub visible_quantity: Quantity,
    pub remaining: Quantity,
}
```

### Execution Logic

You can extend the matching engine to treat `visible_quantity` as the public quantity, but track and decrement `remaining` behind the scenes. Once a visible slice is executed, a new slice is reinserted, creating the iceberg effect.

**Reference:**

* [Investopedia - Iceberg Order](https://www.investopedia.com/terms/i/icebergorder.asp)

---

## 2. Stop-Loss Orders

A **stop-loss order** is only activated when the market crosses a certain price threshold.

```rust
#[derive(Debug, Clone)]
pub struct StopOrder {
    pub id: OrderId,
    pub side: Side,
    pub trigger_price: Price,
    pub quantity: Quantity,
}
```

### Triggering Logic

Stop orders are not added to the order book directly. Instead, they reside in a "watchlist" until the price crosses their trigger. When this happens, they are converted to regular market or limit orders.

**Reference:**

* [Investopedia - Stop Orders](https://www.investopedia.com/terms/s/stoporder.asp)

---

## 3. Adding Event Sourcing

To introduce **event sourcing**, we shift our focus from storing the current state to recording the sequence of events that led to it. This makes the system more robust, auditable, and easier to recover.

### Core Event Types

```rust
pub enum OrderEvent {
    OrderPlaced(Order),
    OrderPartiallyFilled { id: OrderId, filled: Quantity },
    OrderFullyFilled(OrderId),
    OrderCancelled(OrderId),
    IcebergRevealed(OrderId, Quantity),
    StopTriggered(OrderId),
}
```

### Event Log

We append every event to a persistent log (in-memory for now, but ready for durable storage like disk or database).

```rust
pub struct EventStore {
    pub events: Vec<OrderEvent>,
}

impl EventStore {
    pub fn append(&mut self, event: OrderEvent) {
        self.events.push(event);
        // Future: persist to file or database
    }
}
```

### Rebuilding the Order Book

Given an empty book, we can replay the sequence of events to reconstruct the exact state of the system. This is crucial for crash recovery and audit trails.

**Reference:**

* [Martin Fowler - Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

## 4. Bringing It Together

With these extensions, our order book system begins to resemble the core of a professional HFT engine:

* Iceberg and stop orders enable sophisticated order management.
* Event sourcing allows for deterministic recovery and testing.
* Persistence paves the way for journaling and time-travel debugging.

---

## Recommended Reading

To explore these concepts in more depth, here are two excellent books:

1. **"Algorithmic and High-Frequency Trading" by Álvaro Cartea, Sebastian Jaimungal, and José Penalva**
   A rigorous and quantitative introduction to algorithmic strategies and market microstructure.

2. **"Designing Event-Driven Systems" by Ben Stopford**
   Offers a clear explanation of event sourcing, CQRS, and building resilient systems with message logs.

---

## What’s Next?

In upcoming articles, we will:

* Introduce tests and benchmarks to validate correctness and performance.
* Explore serialization (e.g., FlatBuffers or Cap’n Proto) to persist the event log efficiently.
* Integrate these mechanisms with real-time feeds to simulate execution under live market pressure.

---

If you're following along with code, consider breaking the project into modules:

* `core::order`, `core::engine`, `core::events`
* `persistence::event_store`
* `strategies::iceberg`, `strategies::stop`

These abstractions will pay off as we scale toward production-grade infrastructure.
