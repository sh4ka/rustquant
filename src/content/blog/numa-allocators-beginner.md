---
title: "Understanding NUMA allocators for high-performance systems"
description: "Learn how NUMA-aware memory allocation can dramatically improve performance in multi-core trading systems, with practical Rust examples"
pubDate: "Sep 02 2025"
mindmapBranch: "Foundations"
difficulty: "beginner"
concepts: ["NUMA Architecture", "Memory Allocation", "Cache Locality", "Performance Optimization"]
tags: ["rust", "numa", "memory", "performance", "allocators"]
prerequisites: ["phase-1-foundations-of-hft-with-rust"]
relatedArticles: ["phase-1-part-2-advanced-memory-management", "numa-resources"]
---

When building high-frequency trading systems, as we covered in our [foundational infrastructure guide](/blog/phase-1-foundations-of-hft-with-rust/), every nanosecond matters. One often overlooked performance bottleneck is memory allocation strategy, particularly on modern multi-core systems. NUMA (Non-Uniform Memory Access) allocators can provide significant performance improvements by understanding how memory and processors are physically organized.

## What is NUMA?

NUMA stands for [Non-Uniform Memory Access](https://en.wikipedia.org/wiki/Non-uniform_memory_access). In traditional systems, all CPUs share access to a single pool of memory with uniform access times. NUMA systems divide processors and memory into nodes, where each processor has faster access to its local memory and slower access to remote memory.

```rust
// Traditional uniform memory access
CPU1 ←→ Memory Pool ←→ CPU2
    (same latency)

// NUMA system
CPU1 ←→ Local Mem1    CPU2 ←→ Local Mem2
  ↑                     ↑
  └─── Remote Mem2 ─────┘
     (higher latency)
```

## Why NUMA matters for HFT systems

In high-frequency trading, we often have:
- Multiple trading threads processing different instruments
- Market data feeds on dedicated cores
- Risk management calculations on separate processors

Without NUMA awareness, the operating system might allocate memory for a thread on one processor but place the actual memory on a different NUMA node, creating unnecessary latency.

## Memory access latency comparison

Here's what typical memory access looks like on a modern server:

```rust
// Approximate latency on modern hardware
L1 Cache:     1 ns    (fastest)
L2 Cache:     3 ns
L3 Cache:    12 ns
Local NUMA:  60 ns    (same NUMA node)
Remote NUMA: 120 ns   (different NUMA node - 2x slower!)
```

For trading systems targeting sub-microsecond latencies, that 60ns difference can be significant.

## NUMA allocator concepts

A NUMA-aware allocator must understand system topology and make intelligent decisions about memory placement. The primary challenge involves node detection - determining which NUMA node the current thread executes on before making allocation decisions. This requires interfacing with system APIs that map CPU cores to their corresponding memory nodes.

Memory placement becomes critical once system topology is understood. The allocator should prioritize allocating memory on the same node as the accessing thread, minimizing expensive cross-node memory access penalties. However, production systems require sophisticated fallback strategies for cases where local memory is exhausted, potentially requiring allocation on remote nodes while maintaining performance characteristics.

Thread affinity coordination adds another layer of complexity. The allocator must work harmoniously with CPU scheduling decisions to maintain optimal placement over time. This becomes particularly important in HFT systems where thread migration can invalidate carefully planned memory locality.

## NUMA in trading system architecture

In a typical HFT system, different components naturally align with NUMA topology for optimal performance. Market data processors represent the most latency-sensitive component, handling high-frequency market feed updates that require immediate processing and minimal memory access delays. These processors benefit significantly from dedicated NUMA node assignment where both the processing thread and all associated data structures reside on the same physical memory.

Order matching engines form another critical component that benefits from NUMA optimization. These engines process incoming orders against the limit order book, requiring rapid access to price level data and order queues. When the matching engine thread, order book data structures, and incoming order buffers all reside on the same NUMA node, the system can achieve consistent sub-microsecond matching latencies.

Risk management systems perform continuous real-time position and exposure calculations, often maintaining large in-memory portfolios and risk parameters. NUMA-aware allocation ensures these calculations access locally-cached position data without cross-node penalties. Similarly, market making algorithms that generate quotes based on market conditions can maintain their pricing models and historical data on dedicated NUMA nodes, enabling faster quote generation cycles.

## Object pool integration

NUMA allocators work particularly well when combined with object pools, creating a powerful synergy for HFT systems. The foundation of this approach involves pre-allocation strategies where object pools are created with memory allocated on specific NUMA nodes during system initialization. This eliminates allocation overhead during trading hours while ensuring optimal memory placement.

Thread binding becomes crucial to maintain the benefits of NUMA-aware object pools. Worker threads must remain bound to the same NUMA node as their associated object pool throughout their lifecycle. This prevents situations where a thread migrates to a different CPU core on another NUMA node while still accessing objects from its original pool, which would reintroduce the cross-node access penalties.

Lifecycle management requires careful attention to ensure objects return to the correct pool after use. The system must track which NUMA node each object originated from and route it back appropriately. Additionally, robust fallback handling mechanisms must gracefully handle scenarios where pools become exhausted, potentially requiring temporary cross-node allocations while maintaining system stability.

## System topology considerations

Before implementing NUMA allocators, systems need to understand their hardware topology through comprehensive discovery processes. Node discovery involves detecting not only the number of NUMA nodes present in the system but also their individual memory capacities and characteristics. This information becomes critical for making intelligent allocation decisions and capacity planning.

CPU mapping represents another essential aspect of topology understanding. The system must build a complete picture of which CPU cores belong to which NUMA nodes, as this mapping directly influences thread placement decisions. Modern servers often feature complex topologies where cores may be asymmetrically distributed across nodes, making accurate mapping crucial for optimal performance.

Distance matrix analysis provides deeper insights into the relative access costs between different nodes. While local access is always fastest, not all remote accesses are equal - some NUMA nodes may have closer interconnects than others. Understanding these relationships allows for more sophisticated allocation strategies when local memory is unavailable. Finally, availability checking ensures that NUMA support is actually present and enabled on the target system, as some virtualized or older environments may not provide NUMA capabilities.

## Measuring NUMA impact

NUMA performance benefits can be measured through targeted benchmarks comparing local vs. remote memory access patterns. Allocation latency represents the most direct measurement, comparing the time required to allocate memory on local versus remote nodes. These measurements often reveal significant differences, with local allocations typically completing in tens of nanoseconds while remote allocations may require double or triple that time.

Access pattern analysis provides deeper insights into NUMA performance characteristics. Sequential memory access patterns often show dramatic improvements with NUMA optimization, as the processor's prefetch mechanisms work more effectively with local memory. Random access patterns typically show smaller but still measurable improvements, making them valuable for testing worst-case scenarios in trading applications.

Throughput impact measurements assess overall system performance with and without NUMA optimization enabled. These tests often reveal compound benefits where individual NUMA improvements aggregate into substantial overall performance gains. Finally, tail latency analysis focusing on P99.9 characteristics under different memory placement strategies provides crucial insights for HFT systems where consistency matters as much as average performance.

For comprehensive benchmarking techniques specifically designed for HFT systems, see our [nanosecond precision benchmarking guide](/blog/nanosecond-precision-benchmarking-rust-hft/).

## When to use NUMA allocators

NUMA allocators provide the most benefit when:

1. **Long-lived data structures**: Objects that persist and are accessed frequently
2. **Thread-local data**: When threads consistently work with specific data sets
3. **High memory bandwidth**: Applications that stress memory subsystems
4. **Multi-socket systems**: Servers with multiple physical CPUs

For HFT systems, ideal use cases include:
- Order book data structures
- Market data buffers
- Risk calculation working memory
- Historical data caches

## Limitations and considerations

NUMA allocators aren't always beneficial:

- **Short-lived allocations**: The overhead might outweigh benefits
- **Cross-node data sharing**: If data is frequently shared between threads on different nodes
- **Small allocations**: NUMA benefits are most noticeable with larger memory blocks
- **Memory fragmentation**: Node-specific allocation can lead to imbalanced memory usage

## Integration with existing allocators

NUMA-aware allocation can be layered on top of existing Rust allocators like jemalloc or mimalloc through sophisticated composition patterns. Hybrid allocation strategies represent the most practical approach, where systems use NUMA allocation for performance-critical hot paths while falling back to standard allocation for less frequent cold path operations. This approach maximizes performance benefits while minimizing implementation complexity.

Allocator composition involves wrapping existing high-performance allocators with NUMA-aware placement logic. This allows systems to benefit from the mature optimization work in allocators like jemalloc while adding NUMA topology awareness. The wrapper layer handles node detection and placement decisions while delegating the actual memory management to the underlying allocator.

Runtime detection capabilities enable systems to automatically optimize based on discovered system topology. On NUMA-capable systems, the allocator enables topology-aware placement, while on uniform memory systems, it transparently falls back to standard allocation without performance penalties. Performance monitoring adds another layer of sophistication, tracking allocation patterns over time to optimize placement decisions based on actual usage patterns rather than static heuristics.

## Complete NUMA implementation

This article provides the conceptual foundation for NUMA-aware memory management in HFT systems. The concepts covered here - from topology detection to allocator composition - form the theoretical basis for production implementations.

For readers ready to move from concept to code, our comprehensive [advanced memory management guide](/blog/phase-1-part-2-advanced-memory-management/) provides complete, production-ready implementations. That guide includes full NUMA allocator implementations with topology detection, seamless integration with object pools and arena allocators, comprehensive performance benchmarking and validation frameworks, and real-world HFT system examples demonstrating these concepts in action.

The advanced guide transforms these conceptual foundations into working Rust code that can be deployed in production trading systems, complete with error handling, performance monitoring, and integration patterns for existing codebases.

## Next steps

NUMA-aware allocation is just one piece of the high-performance puzzle. Understanding NUMA topology and allocation patterns forms the foundation for building truly high-performance trading systems where every nanosecond of latency reduction contributes to competitive advantage. These concepts become especially important when implementing [high-performance order books](/blog/building-limit-order-book/) and other core trading components.

## Further reading

**External Resources:**
- [NUMA Programming Resources](/blog/numa-resources/) - Comprehensive collection of external NUMA resources, including Intel guides, Linux documentation, Rust APIs, and academic papers

**Related Articles:**
- [Phase 1 Part 2: Advanced memory management](/blog/phase-1-part-2-advanced-memory-management/) - Complete implementation of NUMA allocators
- [Nanosecond precision benchmarking](/blog/nanosecond-precision-benchmarking-rust-hft/) - Measuring NUMA performance accurately
- [Building a limit order book](/blog/building-limit-order-book/) - Applying NUMA concepts to trading systems