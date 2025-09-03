---
title: "Phase 1 Part 1 - Core infrastructure and nanosecond benchmarking"
description: "Building the foundational infrastructure for ultra-low latency HFT systems: project structure, measurement framework, and performance validation with nanosecond precision"
pubDate: "Jul 28 2025"
mindmapBranch: "Foundations"
difficulty: "intermediate"
concepts: ["Project Structure", "Benchmarking", "Performance Measurement", "Rust Workspace"]
tags: ["rust", "hft", "benchmarking", "infrastructure", "performance"]
prerequisites: ["0-initial-plan"]
relatedArticles: ["1-project-roadmap", "numa-allocators-beginner"]
seriesOrder: 3
---

Ultra-low latency trading systems demand measurement precision that exceeds typical software development practices. When targeting sub-microsecond performance, every nanosecond matters, and without accurate measurement, optimization becomes impossible. This article establishes the foundational infrastructure and measurement framework for our HFT system.

## Project structure and workspace design

The project uses a Rust workspace architecture designed for performance isolation and compile-time optimization. Each component is separated into focused crates that can be independently optimized.

```toml
# Cargo.toml (workspace root)
[workspace]
members = [
    "crates/hft-core",
    "crates/hft-benchmarks", 
    "crates/hft-market-data",
    "crates/hft-trading-engine",
    "crates/hft-risk-management"
]

[workspace.dependencies]
# Performance-critical dependencies
criterion = { version = "0.5", features = ["html_reports"] }
jemallocator = "0.5"
libc = "0.2"

# Shared version management for consistency
```

### Core crate architecture

The `hft-core` crate defines fundamental types and traits used across all components:

```rust
// crates/hft-core/src/lib.rs
#![no_std] // Prevent accidental standard library usage in hot paths

/// Fixed-point price representation scaled by 10^8
#[repr(transparent)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Price(pub i64);

/// Atomic quantity representation
#[repr(transparent)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Quantity(pub u64);

/// Nanosecond timestamp
#[repr(transparent)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Timestamp(pub u64);

impl Timestamp {
    /// Get current timestamp using RDTSC for maximum performance
    #[inline(always)]
    pub fn now() -> Self {
        unsafe {
            Self(core::arch::x86_64::_rdtsc())
        }
    }
    
    /// Convert to nanoseconds since epoch
    pub fn as_nanos(self) -> u64 {
        // Convert TSC cycles to nanoseconds
        // This requires CPU frequency calibration
        self.0 * 1000 / cpu_frequency_mhz()
    }
}

/// CPU frequency in MHz (must be calibrated at startup)
static CPU_FREQUENCY_MHZ: std::sync::atomic::AtomicU64 = 
    std::sync::atomic::AtomicU64::new(0);

fn cpu_frequency_mhz() -> u64 {
    CPU_FREQUENCY_MHZ.load(std::sync::atomic::Ordering::Relaxed)
}
```

### Performance configuration

All crates use aggressive optimization settings:

```toml
# Cargo.toml (in each crate)
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
debug = false
overflow-checks = false

# Custom profile for benchmarking
[profile.bench]
inherits = "release"
debug = true  # Keep symbols for profiling
```

## Nanosecond-precision benchmarking framework

The benchmarking framework measures performance at nanosecond precision using hardware timestamps and statistical analysis to detect performance regressions.

### High-resolution timing

```rust
// crates/hft-benchmarks/src/timing.rs
use core::arch::x86_64::{_rdtsc, _mm_lfence, _mm_mfence};

/// High-precision timer using CPU timestamp counter
pub struct PrecisionTimer {
    start: u64,
    frequency_mhz: u64,
}

impl PrecisionTimer {
    /// Start timing with memory fence to prevent reordering
    #[inline(always)]
    pub fn start() -> Self {
        unsafe {
            _mm_mfence(); // Full memory barrier
            let start = _rdtsc();
            _mm_lfence(); // Load fence
            
            Self {
                start,
                frequency_mhz: cpu_frequency_mhz(),
            }
        }
    }
    
    /// Stop timing and return elapsed nanoseconds
    #[inline(always)]
    pub fn stop(self) -> u64 {
        unsafe {
            _mm_lfence(); // Prevent reordering
            let end = _rdtsc();
            _mm_mfence(); // Memory barrier
            
            let cycles = end - self.start;
            (cycles * 1000) / self.frequency_mhz
        }
    }
}
```

### Statistical analysis framework

```rust
// crates/hft-benchmarks/src/stats.rs
pub struct BenchmarkResults {
    measurements: Vec<u64>,
    name: String,
}

impl BenchmarkResults {
    pub fn new(name: String) -> Self {
        Self {
            measurements: Vec::with_capacity(10000),
            name,
        }
    }
    
    pub fn record(&mut self, nanoseconds: u64) {
        self.measurements.push(nanoseconds);
    }
    
    pub fn analyze(&self) -> BenchmarkAnalysis {
        let mut sorted = self.measurements.clone();
        sorted.sort_unstable();
        
        let len = sorted.len();
        BenchmarkAnalysis {
            name: self.name.clone(),
            count: len,
            min: sorted[0],
            max: sorted[len - 1],
            mean: sorted.iter().sum::<u64>() / len as u64,
            p50: sorted[len / 2],
            p95: sorted[len * 95 / 100],
            p99: sorted[len * 99 / 100],
            p999: sorted[len * 999 / 1000],
        }
    }
}

#[derive(Debug)]
pub struct BenchmarkAnalysis {
    pub name: String,
    pub count: usize,
    pub min: u64,
    pub max: u64,
    pub mean: u64,
    pub p50: u64,
    pub p95: u64,
    pub p99: u64,
    pub p999: u64,
}
```

## Memory allocation benchmarking

Since memory allocation is critical for performance, we benchmark different allocation strategies:

```rust
// crates/hft-benchmarks/src/allocation.rs
use jemallocator::Jemalloc;

#[global_allocator]
static GLOBAL: Jemalloc = Jemalloc;

/// Benchmark memory allocation patterns
pub fn benchmark_allocations() {
    const ITERATIONS: usize = 100000;
    let mut results = BenchmarkResults::new("allocation_benchmark".to_string());
    
    // Benchmark different allocation sizes
    for size in [64, 128, 256, 512, 1024, 4096] {
        for _ in 0..ITERATIONS {
            let timer = PrecisionTimer::start();
            let _data = vec![0u8; size];
            let elapsed = timer.stop();
            results.record(elapsed);
        }
        
        let analysis = results.analyze();
        println!("Allocation {}B: P99 = {}ns", size, analysis.p99);
    }
}

/// Benchmark object pools vs direct allocation
pub fn benchmark_object_pools() {
    use std::sync::Mutex;
    
    struct ObjectPool<T> {
        objects: Mutex<Vec<Box<T>>>,
    }
    
    impl<T: Default> ObjectPool<T> {
        fn new() -> Self {
            Self {
                objects: Mutex::new(Vec::with_capacity(1000)),
            }
        }
        
        fn get(&self) -> Box<T> {
            self.objects.lock().unwrap().pop()
                .unwrap_or_else(|| Box::new(T::default()))
        }
        
        fn put(&self, obj: Box<T>) {
            if let Ok(mut objects) = self.objects.try_lock() {
                if objects.len() < 1000 {
                    objects.push(obj);
                }
            }
        }
    }
    
    // Compare pool vs direct allocation
    let pool = ObjectPool::<[u64; 64]>::new();
    let mut pool_results = BenchmarkResults::new("pool_allocation".to_string());
    let mut direct_results = BenchmarkResults::new("direct_allocation".to_string());
    
    // Benchmark pool allocation
    for _ in 0..10000 {
        let timer = PrecisionTimer::start();
        let obj = pool.get();
        let elapsed = timer.stop();
        pool.put(obj);
        pool_results.record(elapsed);
    }
    
    // Benchmark direct allocation
    for _ in 0..10000 {
        let timer = PrecisionTimer::start();
        let _obj = Box::new([0u64; 64]);
        let elapsed = timer.stop();
        direct_results.record(elapsed);
    }
    
    println!("Pool allocation P99: {}ns", pool_results.analyze().p99);
    println!("Direct allocation P99: {}ns", direct_results.analyze().p99);
}
```

## CPU frequency calibration

Accurate timing requires CPU frequency calibration:

```rust
// crates/hft-benchmarks/src/calibration.rs
use std::time::{Duration, Instant};

/// Calibrate CPU timestamp counter frequency
pub fn calibrate_tsc_frequency() -> u64 {
    const CALIBRATION_DURATION_MS: u64 = 1000;
    
    let start_time = Instant::now();
    let start_tsc = unsafe { core::arch::x86_64::_rdtsc() };
    
    std::thread::sleep(Duration::from_millis(CALIBRATION_DURATION_MS));
    
    let end_time = Instant::now();
    let end_tsc = unsafe { core::arch::x86_64::_rdtsc() };
    
    let elapsed_ns = end_time.duration_since(start_time).as_nanos() as u64;
    let tsc_cycles = end_tsc - start_tsc;
    
    let frequency_mhz = (tsc_cycles * 1000) / elapsed_ns;
    
    println!("Calibrated TSC frequency: {} MHz", frequency_mhz);
    
    // Store globally for use by timestamp functions
    CPU_FREQUENCY_MHZ.store(frequency_mhz, std::sync::atomic::Ordering::Relaxed);
    
    frequency_mhz
}
```

## Performance validation tests

Comprehensive tests validate our performance assumptions:

```rust
// crates/hft-benchmarks/tests/performance_tests.rs
use hft_benchmarks::*;

#[test]
fn test_timestamp_performance() {
    calibrate_tsc_frequency();
    let mut results = BenchmarkResults::new("timestamp_creation".to_string());
    
    for _ in 0..100000 {
        let timer = PrecisionTimer::start();
        let _ts = Timestamp::now();
        let elapsed = timer.stop();
        results.record(elapsed);
    }
    
    let analysis = results.analyze();
    assert!(analysis.p99 < 50, "Timestamp creation P99 should be < 50ns, got {}ns", analysis.p99);
}

#[test] 
fn test_basic_arithmetic_performance() {
    let mut results = BenchmarkResults::new("price_arithmetic".to_string());
    let price1 = Price(1000000000); // $10.00
    let price2 = Price(500000000);  // $5.00
    
    for _ in 0..100000 {
        let timer = PrecisionTimer::start();
        let _result = Price(price1.0 + price2.0);
        let elapsed = timer.stop();
        results.record(elapsed);
    }
    
    let analysis = results.analyze();
    assert!(analysis.p99 < 10, "Price arithmetic P99 should be < 10ns, got {}ns", analysis.p99);
}
```

## System configuration and optimization

The framework includes system optimization utilities:

```rust
// crates/hft-core/src/system.rs
use libc::{sched_setaffinity, cpu_set_t, CPU_SET, CPU_ZERO, getpid};

/// Pin current thread to specific CPU core
pub fn set_cpu_affinity(core_id: usize) -> Result<(), std::io::Error> {
    unsafe {
        let mut cpu_set: cpu_set_t = std::mem::zeroed();
        CPU_ZERO(&mut cpu_set);
        CPU_SET(core_id, &mut cpu_set);
        
        let result = sched_setaffinity(0, std::mem::size_of::<cpu_set_t>(), &cpu_set);
        if result != 0 {
            Err(std::io::Error::last_os_error())
        } else {
            Ok(())
        }
    }
}

/// Set thread scheduling priority
pub fn set_realtime_priority() -> Result<(), std::io::Error> {
    unsafe {
        let param = libc::sched_param {
            sched_priority: 99, // Highest real-time priority
        };
        
        let result = libc::sched_setscheduler(0, libc::SCHED_FIFO, &param);
        if result != 0 {
            Err(std::io::Error::last_os_error())
        } else {
            Ok(())
        }
    }
}
```

## Integration and testing

A comprehensive test suite validates the infrastructure:

```bash
# Run all benchmarks with statistical validation
cargo test --release --package hft-benchmarks

# Generate performance reports
cargo bench --package hft-benchmarks -- --output-format html

# Profile with perf for detailed analysis
sudo perf record --call-graph dwarf cargo bench
sudo perf report
```

## Performance targets validation

The infrastructure validates our nanosecond-level performance targets:

- Timestamp creation: < 50 nanoseconds (P99)
- Basic arithmetic: < 10 nanoseconds (P99)  
- Memory allocation: < 200 nanoseconds (P99)
- Thread affinity setting: < 1 microsecond

These measurements establish the baseline performance characteristics required for the complete HFT system.

## Next steps

Part 2 of Phase 1 covers advanced memory management techniques including custom allocators, lock-free data structures, and NUMA optimization. For beginners to NUMA concepts, start with our [introduction to NUMA allocators](/blog/numa-allocators-beginner/), then proceed to the [comprehensive memory management guide](/blog/phase-1-part-2-advanced-memory-management/). We'll implement object pools, ring buffers, and cache-optimized data structures that form the foundation for ultra-low latency operations.