---
title: "Understanding market microstructure in high-frequency trading"
description: "A deep dive into the fundamental mechanics of modern electronic markets. This article explains what happens at the order book level, how spreads, ticks, and depth work, and why microseconds matter in the world of high-frequency trading."
pubDate: "Jul 29 2025"
mindmapBranch: "Foundations"
difficulty: "intermediate"
concepts: ["Market Microstructure", "Order Book", "Price Discovery", "Market Making"]
tags: ["hft", "market-microstructure", "order-book", "trading", "theory"]
relatedArticles: ["building-limit-order-book", "limit-order-book"]
---

Before we dive in, a quick **disclaimer**: I’m not an expert in market microstructure, and this article is not intended as authoritative guidance. Rather, this is a synthesis of publicly available knowledge as I build my own understanding of how modern electronic markets work, especially from the perspective of high-frequency trading (HFT) system design.

Much of the information here can be found in greater depth in excellent resources like:

- [The Science of Algorithmic Trading and Portfolio Management by Robert Kissell](https://amzn.eu/d/44U8SNG)
- [Market Microstructure Theory by Maureen O’Hara](https://amzn.eu/d/12QKvvn)
- [Trading and Exchanges by Larry Harris](https://amzn.eu/d/eZrgt92)
- [Nasdaq TotalView-ITCH Specification](https://www.nasdaqtrader.com/content/technicalsupport/specifications/dataproducts/NQTVITCHSpecification.pdf)
- [FIX Trading Community – Online Specification](https://www.fixtrading.org/online-specification/)

This is a simplified and pragmatic look meant to support the development of a Rust-based HFT framework. Now, let’s explore what market microstructure is and why it matters.

## What is market microstructure?

Market microstructure refers to the rules, behaviors, and systems that determine how orders are submitted, processed, matched, and executed in an exchange. While the macro-level view of trading involves charts and trends, the micro-level is concerned with how individual orders interact within the order book.

Understanding this layer is essential for high-frequency traders because every optimization — from latency tuning to strategy logic — depends on the precise behavior of the market at this level.

## The limit order book

Most modern electronic exchanges use a **limit order book (LOB)** as the primary mechanism to manage liquidity. The order book is a data structure that lists all outstanding buy and sell orders for a given asset.

- **Bids**: Buy orders waiting to be filled.
- **Asks**: Sell orders waiting to be filled.
- **Best bid**: The highest buy price currently in the book.
- **Best ask**: The lowest sell price currently in the book.
- **Spread**: The difference between best ask and best bid.

The LOB is typically sorted by price and then time, giving preference to the earliest orders at the same price — this is called *price-time priority*.

## Ticks and price resolution

A **tick** is the minimum price increment allowed by an exchange. If a stock has a tick size of $0.01, then the price can move from $10.00 to $10.01, but not to $10.005.

Tick size affects market dynamics significantly:

- **Small tick size** → tighter spreads but possibly more message traffic.
- **Large tick size** → wider spreads but fewer order updates.

In HFT, you may design strategies that try to exploit *tick-size effects* — for example, placing orders just inside the spread.

## Depth and liquidity

**Market depth** refers to the amount of volume available at each price level in the book. A "deep" market has many resting orders across multiple price levels, which provides liquidity and reduces slippage.

Depth is especially important for:

- Understanding potential price impact of large orders.
- Estimating short-term volatility.
- Designing strategies that interact with passive liquidity.

Some feeds give only the top of book (Level 1), while others offer full depth (Level 2). Most HFT strategies rely heavily on Level 2 data.

## Latency and reaction time

In high-frequency environments, **latency** is the time it takes from when an event happens (e.g., a new order arrives) to when your system reacts.

Sources of latency include:

- Network transmission delays.
- OS and kernel overhead.
- Message decoding and parsing.
- Decision logic.
- Order submission time.

Market microstructure analysis helps identify *when* it's worth reacting and *how fast* your system needs to be. In some cases, reacting even 10 microseconds later means you're already behind.

## Order types and behavior

Not all orders are equal. Exchanges offer a variety of order types with different behaviors:

- **Limit orders**: Specify a price and wait.
- **Market orders**: Execute immediately at the best available price.
- **Immediate-or-cancel (IOC)** and **fill-or-kill (FOK)**: Time-sensitive orders.
- **Post-only**: Ensures the order does not take liquidity.

Each exchange may have its own quirks, and understanding how these affect queue positioning, visibility, and fees is critical.

## Queue positioning and matching priority

Getting your order to the top of the queue at a given price level can be the difference between being filled or not. Exchanges typically use:

- **Price-time priority**: Orders are sorted first by price, then by arrival time.
- **Pro-rata matching**: Orders at the same price are matched proportionally to their size.

Queue mechanics influence many HFT strategies, especially those focused on *passive alpha* (earning the spread rather than crossing it).

## Conclusion

Market microstructure is the foundation of high-frequency trading. Without understanding the behavior of the order book, latency-sensitive events, and execution rules, it's impossible to design efficient or profitable trading systems.

This article is just a basic outline. I strongly encourage you to explore the sources linked above to deepen your understanding. In the upcoming articles, we will look at how matching engines work, how to consume market data feeds in real time, and how to build systems in Rust that can process and react to this information with minimal latency.

Stay tuned.
