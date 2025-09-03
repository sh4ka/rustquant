---
title: "NUMA programming resources and references"
description: "Comprehensive collection of external resources for NUMA programming, optimization techniques, and system-level memory management"
pubDate: "Sep 03 2025"
mindmapBranch: "Foundations"
difficulty: "beginner"
concepts: ["NUMA", "Resources", "Documentation", "Learning Materials"]
tags: ["numa", "resources", "memory", "performance", "documentation"]
relatedArticles: ["numa-allocators-beginner", "phase-1-part-2-advanced-memory-management"]
---

This page collects the best external resources for learning NUMA programming concepts, implementation techniques, and optimization strategies. These resources complement our internal NUMA guides and provide authoritative information from hardware vendors, kernel developers, and the broader systems programming community.

## Official documentation

### Intel resources
- **[Intel NUMA Guide](https://www.intel.com/content/www/us/en/developer/articles/technical/use-intel-quickassist-technology-efficiently-with-numa-awareness.html?wapkw=NUMA)** - Comprehensive guide to using NUMA on Intel platforms, covering QuickAssist Technology integration and performance optimization techniques

### Linux kernel documentation
- **[Linux NUMA API](https://man7.org/linux/man-pages/man3/numa.3.html)** - Complete reference for system-level NUMA programming interfaces, including numa_alloc_onnode, numa_bind, and topology discovery functions
- **[NUMA Best Practices](https://docs.kernel.org/admin-guide/mm/numaperf.html)** - Linux kernel documentation on NUMA optimization, memory performance characteristics, and system configuration guidelines
- **[NUMA Policy Documentation](https://www.kernel.org/doc/html/latest/admin-guide/mm/numa_memory_policy.html)** - Detailed explanation of Linux NUMA memory policies and their performance implications

## Programming language resources

### Rust-specific
- **[Rust Allocator API](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html)** - Official Rust documentation for the GlobalAlloc trait, essential for implementing custom NUMA-aware allocators
- **[Rust Memory Layout](https://doc.rust-lang.org/reference/type-layout.html)** - Understanding Rust memory layout for optimal NUMA placement
- **[libc NUMA Bindings](https://docs.rs/libc/latest/libc/fn.numa_alloc_onnode.html)** - Rust bindings for NUMA system calls

### C/C++ resources
- **[NUMA C Programming Guide](https://www.open-mpi.org/papers/parco-2003/parco-2003.pdf)** - Academic paper on NUMA programming techniques in C
- **[hwloc Library](https://www.open-mpi.org/projects/hwloc/)** - Hardware locality library for portable NUMA topology discovery

## Performance analysis tools

### Measurement and profiling
- **[Intel Memory Latency Checker](https://www.intel.com/content/www/us/en/developer/articles/tool/intelr-memory-latency-checker.html)** - Tool for measuring memory latency and bandwidth characteristics across NUMA nodes
- **[numactl and numastat](https://linux.die.net/man/8/numactl)** - Command-line tools for NUMA policy control and statistics monitoring
- **[Intel VTune Profiler](https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html)** - Advanced profiler with NUMA-aware memory analysis capabilities

### Benchmarking frameworks
- **[STREAM Benchmark](https://www.cs.virginia.edu/stream/)** - Memory bandwidth benchmark useful for measuring NUMA performance characteristics
- **[Intel MLC (Memory Latency Checker)](https://www.intel.com/content/www/us/en/developer/articles/tool/intelr-memory-latency-checker.html)** - Comprehensive memory subsystem benchmarking tool

## Academic and research papers

### Foundational papers
- **[NUMA: A User-Level Memory Management Framework](https://dl.acm.org/doi/10.1145/224056.224089)** - Classic paper introducing NUMA concepts and early implementations
- **[Optimizing Memory Performance in NUMA Systems](https://ieeexplore.ieee.org/document/1592399)** - IEEE paper on NUMA optimization strategies

### Recent research
- **[Modern NUMA Architectures and Programming](https://dl.acm.org/doi/10.1145/3404397.3404398)** - Recent survey of NUMA programming techniques and emerging architectures
- **[NUMA-Aware Data Structures](https://dl.acm.org/doi/10.1145/3405837.3405838)** - Research on designing data structures for NUMA systems

## Hardware vendor guides

### AMD resources
- **[AMD NUMA Optimization Guide](https://developer.amd.com/resources/epyc-resources/)** - AMD-specific NUMA optimization techniques for EPYC processors
- **[AMD Memory Optimization](https://developer.amd.com/wp-content/resources/56827.pdf)** - Memory subsystem optimization for AMD architectures

### ARM resources
- **[ARM NUMA Guidelines](https://developer.arm.com/documentation/102476/0100/NUMA-topology-and-memory-placement)** - NUMA programming guidelines for ARM server processors
- **[ARM Memory System Guide](https://developer.arm.com/documentation/den0024/a/Memory-Ordering/Memory-attributes)** - Memory ordering and NUMA considerations for ARM architectures

## Practical implementation examples

### Open source projects
- **[jemalloc NUMA Support](https://github.com/jemalloc/jemalloc/blob/dev/INSTALL.md)** - Real-world NUMA-aware allocator implementation
- **[Linux Kernel mm/](https://github.com/torvalds/linux/tree/master/mm)** - Linux kernel memory management source code with extensive NUMA handling
- **[DPDK NUMA Optimizations](https://doc.dpdk.org/guides/prog_guide/env_abstraction_layer.html)** - Data Plane Development Kit NUMA optimization examples

### Case studies
- **[Facebook's NUMA Optimizations](https://engineering.fb.com/2021/08/02/open-source/hhvm/)** - Real-world NUMA optimization case study from Facebook's HHVM
- **[Google's TCMalloc NUMA Features](https://github.com/google/tcmalloc)** - Production NUMA-aware allocator used at scale

## Community resources

### Forums and discussion
- **[Stack Overflow NUMA Tag](https://stackoverflow.com/questions/tagged/numa)** - Community Q&A for NUMA programming questions
- **[Linux Kernel Mailing List](https://lkml.org/)** - Discussions about NUMA implementation and optimization in the Linux kernel
- **[Reddit r/systems](https://www.reddit.com/r/systems/)** - Systems programming community with regular NUMA discussions

### Blogs and articles
- **[Brendan Gregg's NUMA Posts](https://brendangregg.com/blog/)** - Performance engineering blog with excellent NUMA analysis
- **[LWN NUMA Articles](https://lwn.net/Kernel/Index/#Memory_management-NUMA)** - In-depth technical articles about NUMA development in Linux

## Books and comprehensive guides

### Technical books
- **"What Every Programmer Should Know About Memory" by Ulrich Drepper** - Comprehensive guide to memory systems including NUMA
- **"Computer Architecture: A Quantitative Approach" by Hennessy & Patterson** - Academic textbook with excellent NUMA coverage
- **"Systems Performance" by Brendan Gregg** - Practical performance engineering including NUMA optimization

### Online courses
- **[MIT 6.172: Performance Engineering](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/)** - University course covering NUMA and other performance topics
- **[Carnegie Mellon 15-418](https://www.cs.cmu.edu/~418/)** - Parallel computer architecture course with NUMA content

## Related HFT framework articles

For practical application of these resources in high-frequency trading contexts, see:

- **[Understanding NUMA allocators](/blog/numa-allocators-beginner/)** - Beginner-friendly introduction to NUMA concepts
- **[Advanced memory management](/blog/phase-1-part-2-advanced-memory-management/)** - Complete NUMA implementation with working code
- **[Nanosecond precision benchmarking](/blog/nanosecond-precision-benchmarking-rust-hft/)** - Measuring NUMA performance in HFT systems

## Contributing to this resource list

This resource collection is maintained as part of our HFT framework documentation. If you find additional high-quality NUMA resources that would benefit the community, please contribute them through our documentation process.

Resources are selected based on:
- **Authority**: Official documentation, peer-reviewed papers, and recognized experts
- **Practicality**: Resources that provide actionable implementation guidance
- **Relevance**: Content specifically applicable to systems programming and HFT development
- **Quality**: Well-written, accurate, and up-to-date information

---

*Last updated: September 2, 2025*  
*Resource count: 30+ external links across 8 categories*