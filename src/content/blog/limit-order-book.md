---
title: Building a Limit Order Book in Rust
description: Step-by-step guide to designing and implementing a performant limit order book core for HFT applications using Rust, covering data structures, order matching logic, and best practices.
pubDate: "Aug 2 2025"
---

# Introduction

In high-frequency trading systems, the limit order book (LOB) is the fundamental component that maintains all resting buy and sell orders and matches them according to price-time priority. In this article we will:

* Define the core data types for orders and book sides
* Choose efficient data structures for price levels
* Implement order insertion, cancellation, and matching logic
* Follow Rust best practices and design patterns for performance and maintainability

# 1. Core data types

First, let us define the basic building blocks: the `Order` struct and the enumeration for buy/sell sides.

```rust
/// Unique identifier for an order
pub type OrderId = u64;

/// Side of an order: Bid or Ask
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Bid,
    Ask,
}

/// A Limit Order
#[derive(Debug, Clone)]
pub struct Order {
    pub id: OrderId,
    pub side: Side,
    pub price: u64,    // Price in ticks (smallest unit)
    pub quantity: u64, // Remaining quantity
    pub timestamp: u64 // Epoch timestamp for time priority
}
```

* We use `u64` for `price` and `quantity` to avoid negative values and ensure wide ranges.
* `timestamp` ensures strict FIFO matching within the same price level.

# 2. Price level and order queue

Each price level holds a queue of orders in time priority. A `VecDeque` is a natural choice:

```rust
use std::collections::VecDeque;

/// Orders at a single price level
pub struct PriceLevel {
    pub price: u64,
    pub orders: VecDeque<Order>,
}

impl PriceLevel {
    pub fn new(price: u64) -> Self {
        Self { price, orders: VecDeque::new() }
    }

    pub fn add_order(&mut self, order: Order) {
        self.orders.push_back(order);
    }

    pub fn pop_front(&mut self) -> Option<Order> {
        self.orders.pop_front()
    }
}
```

* `VecDeque` offers O(1) push/pop at both ends.
* Wrapping in a `PriceLevel` struct gives a clear API for managing orders.

# 3. Book sides and data structure choice

To maintain sorted price levels, we need a structure keyed by price. Two common options:

* `BTreeMap<u64, PriceLevel>`: balanced tree, O(log n) insertion and removal.
* Skiplist via crates like `skiplist` for comparable performance in some situations. Important, check benchmarks first: https://github.com/sh4ka/skiplist-demo

For simplicity and reliability, we’ll use `BTreeMap`:

```rust
use std::collections::BTreeMap;

/// One side of the book (bids or asks)
pub struct BookSide {
    levels: BTreeMap<u64, PriceLevel>,
}

impl BookSide {
    pub fn new() -> Self {
        Self { levels: BTreeMap::new() }
    }

    /// Get best price (highest for bids, lowest for asks)
    pub fn best_price(&self, side: Side) -> Option<u64> {
        match side {
            Side::Bid => self.levels.keys().rev().next().cloned(),
            Side::Ask => self.levels.keys().next().cloned(),
        }
    }

    /// Insert order into its price level
    pub fn insert(&mut self, order: Order) {
        let level = self.levels
            .entry(order.price)
            .or_insert_with(|| PriceLevel::new(order.price));
        level.add_order(order);
    }

    /// Remove a whole price level when empty
    pub fn remove_level_if_empty(&mut self, price: u64) {
        if let Some(level) = self.levels.get(&price) {
            if level.orders.is_empty() {
                self.levels.remove(&price);
            }
        }
    }
}
```

# 4. Matching engine logic

The matching engine takes incoming orders and attempts to fill them against the opposite side:

```rust
pub struct OrderBook {
    bids: BookSide,
    asks: BookSide,
    next_order_id: OrderId,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            bids: BookSide::new(),
            asks: BookSide::new(),
            next_order_id: 1,
        }
    }

    /// Submit a new limit order; returns remaining quantity if not fully filled
    pub fn submit_limit_order(&mut self, mut order: Order) -> u64 {
        let (own_side, other_side) = match order.side {
            Side::Bid => (&mut self.bids, &mut self.asks),
            Side::Ask => (&mut self.asks, &mut self.bids),
        };

        while order.quantity > 0 {
            // Peek best opposite price
            if let Some(best_price) = other_side.best_price(match order.side {
                Side::Bid => Side::Ask,
                Side::Ask => Side::Bid,
            }) {
                let should_match = match order.side {
                    Side::Bid => order.price >= best_price,
                    Side::Ask => order.price <= best_price,
                };
                if !should_match {
                    break;
                }

                // Match at this price level
                if let Some(level) = other_side.levels.get_mut(&best_price) {
                    while let Some(mut resting) = level.pop_front() {
                        let traded = resting.quantity.min(order.quantity);
                        resting.quantity -= traded;
                        order.quantity -= traded;

                        // Notify trade events here (omitted for brevity)

                        if resting.quantity > 0 {
                            // Partial fill, re-queue remaining
                            level.orders.push_front(resting);
                            break;
                        }
                        if order.quantity == 0 {
                            break;
                        }
                    }
                    other_side.remove_level_if_empty(best_price);
                }
            } else {
                break;
            }
        }

        // If there is remaining quantity, insert into own side
        if order.quantity > 0 {
            own_side.insert(order);
        }

        order.quantity
    }
}
```

# 5. Putting it all together

Here is an example usage:

```rust
fn main() {
    let mut book = OrderBook::new();

    let order1 = Order { id: 1, side: Side::Ask, price: 100, quantity: 10, timestamp: 1 };
    book.submit_limit_order(order1);

    let taker = Order { id: 2, side: Side::Bid, price: 105, quantity: 5, timestamp: 2 };
    let remaining = book.submit_limit_order(taker);
    println!("Taker remaining: {}", remaining);
}
```

This will match 5 units at price 100, leaving the ask side with 5 at 100.

# 6. Next steps and optimizations

* Memory Management: Use object pools or arena allocators for orders to reduce heap overhead.
* Concurrency: For multi-threaded matching, partition the book by instrument or shard price ranges.
* Performance Tuning: Replace `BTreeMap` with a specialized skiplist or a custom radix tree for lower latency.
* In the following articles we will add comprehensive unit and integration tests as well as memory and CPU benchmarking harnesses to measure throughput and latency and guide our optimizations for high-frequency trading environments.

# 7. Performance analysis and discussion

While this Rust-based limit order book is functionally correct, in a high-frequency trading (HFT) context true performance comes down to microsecond and even nanosecond optimizations. Here is an overview of where our current design stands and which areas require further tuning:
- Algorithmic complexity:
    - Insertion and removal of price levels via BTreeMap is O(log P), where P is the number of distinct price levels.
    - Order queue operations (VecDeque) are amortized O(1) for push and pop.
    - Matching a single order against k levels costs O(k · (log P + 1)). In practice for tight markets k is small, but worst-case can grow.

- Memory allocation overhead:
  - Each new Order and PriceLevel allocation incurs a heap allocation. At HFT throughput of tens of thousands of orders per second, allocator contention and cache misses become significant.
  - Object pooling or slab allocators can reduce these costs by reusing memory and improving cache locality.

- Data structure trade‑offs:
  - BTreeMap provides safety and predictability, but its node-based structure can produce pointer chasing and cache misses.
  - Alternate structures like a custom fixed‑size ring buffer and index arrays or a highly optimized skiplist can reduce pointer indirection and branch mispredictions.

- Latency sources:
    - Locking or shared-memory coordination in multi-threaded contexts.
    - Dynamic allocations on critical path.
    - Pointer-chasing in balanced trees.

- Benchmarking strategy:
    - Microbenchmarks of single-threaded operations (insert, match, cancel) with Rust’s criterion crate.
    - Memory-profiling with tools like perf, valgrind massif, and jemalloc statistics.
    - Multi-threaded scalability tests under synthetic workloads.

# Code
Full code example can be found at https://github.com/sh4ka/limit-order-book

In the next article, we will explore advanced order types (iceberg, stop-loss) and extend our engine with event sourcing and persistence.
