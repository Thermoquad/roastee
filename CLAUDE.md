# Roastee - AI Assistant Guide

> **Note:** This file documents the Roastee project specifically.
> Always read the [Thermoquad Organization CLAUDE.md](../../CLAUDE.md) first
> for organization-wide structure and conventions.

## Overview

Roastee is a TypeScript monorepo containing packages for the Thermoquad PWA ecosystem.

**Current Packages:**

- `fusain` - TypeScript implementation of the Fusain protocol

**Future:**

- Roastee PWA application (not yet implemented)

## Structure

```
roastee/
├── .tool-versions            # asdf: Node.js version
├── pnpm-workspace.yaml       # pnpm workspace config
├── package.json              # Root package (private)
├── Taskfile.dist.yml         # Task runner
├── README.md
├── CLAUDE.md                 # This file
└── packages/
    └── fusain/               # Fusain protocol package
        ├── package.json      # Published as "fusain" on npm
        ├── tsconfig.json
        ├── vitest.config.ts
        ├── src/
        │   ├── index.ts      # Public exports
        │   ├── constants.ts  # Protocol constants
        │   ├── types.ts      # TypeScript types
        │   ├── crc.ts        # CRC-16-CCITT
        │   ├── cbor.ts       # CBOR parsing helpers
        │   ├── packet.ts     # Packet class
        │   ├── decoder.ts    # State machine decoder
        │   ├── encoder.ts    # Packet encoder
        │   └── *.test.ts     # Tests
        └── README.md
```

## Building

```bash
# Install dependencies
task install

# Build all packages
task build

# Run tests
task test

# Run tests with coverage (100% required)
task test:coverage

# CI checks (format + coverage)
task ci
```

## Fusain Package

The `fusain` package provides a TypeScript implementation of the Fusain
protocol, matching the C and Go implementations.

### Key Components

| File | Purpose |
|------|---------|
| `constants.ts` | Protocol framing bytes, message types, enums |
| `types.ts` | TypeScript interfaces and error classes |
| `crc.ts` | CRC-16-CCITT implementation |
| `cbor.ts` | CBOR parsing and payload map helpers |
| `packet.ts` | Packet class with lazy CBOR parsing |
| `decoder.ts` | State machine for byte stream decoding |
| `encoder.ts` | Packet encoding with byte stuffing |

### Protocol Wire Format

```
START_BYTE (0x7E)
LENGTH (1 byte) - CBOR payload length
ADDRESS (8 bytes) - Device address (little-endian)
CBOR_PAYLOAD (variable) - [msg_type, payload_map]
CRC_HIGH (1 byte)
CRC_LOW (1 byte)
END_BYTE (0x7F)
```

### Usage Contexts

The package is designed for:

- **Servers:** TCP or WebSocket communication with embedded devices
- **Clients:** WebSocket or Web Bluetooth communication from browsers

### Testing

Tests use Vitest with 100% coverage requirement:

```bash
cd packages/fusain
pnpm test:coverage
```

Coverage thresholds are enforced in `vitest.config.ts`.

## NPM Publishing

The `fusain` package is published to npm via GitHub Actions workflow.

**Trigger:** Manual workflow dispatch (`workflow_dispatch`)

**Process:**

1. Workflow installs dependencies
2. Runs `task ci` (format check + tests with coverage)
3. Builds the package
4. Publishes to npm using `NPM_TOKEN` secret

## Related Projects

### Fusain Implementations

| Implementation | Location | Language |
|----------------|----------|----------|
| Embedded (Zephyr) | `modules/lib/fusain/` | C |
| Heliostat Analyzer | `tools/heliostat/pkg/fusain/` | Go |
| Roastee | `apps/roastee/packages/fusain/` | TypeScript |

### Protocol Specification

Canonical specification: https://thermoquad.github.io/origin/specifications/fusain/

## Development Conventions

### Code Style

- ESLint for linting
- Prettier for formatting
- Strict TypeScript (`strict: true`)

### Naming

- `camelCase` for functions and variables
- `PascalCase` for types and classes
- `UPPER_SNAKE_CASE` for constants

### Testing

- 100% test coverage required
- Tests in `*.test.ts` files alongside source
- Use `describe`/`it` blocks from Vitest

## Git Workflow

Follow the organization git workflow in `../../CLAUDE.md`.

**Commit Scopes:**

- `fusain` - Fusain package changes
- `roastee` - Root/monorepo changes
- `deps` - Dependency updates

---

## AI Assistant Operations

To reload all organization CLAUDE.md files or run a content integrity check, see
the **CLAUDE.md Reload** and **Content Integrity Check** sections in the
[Thermoquad Organization CLAUDE.md](../../CLAUDE.md).

---

## Licensing

This repository uses a dual-license structure:

| Component | License | SPDX Identifier |
|-----------|---------|-----------------|
| Roastee monorepo | GNU GPL v2 or later | `GPL-2.0-or-later` |
| fusain package | Apache License 2.0 | `Apache-2.0` |

**Why dual licensing?**

The `fusain` package is licensed under Apache-2.0 to maintain compatibility with
the other Fusain implementations (C embedded library and Go analyzer) used across
the Thermoquad ecosystem. Apache-2.0 allows the protocol library to be used in
both open source and proprietary embedded systems.

The Roastee PWA application (when implemented) will be GPL-2.0-or-later.

**SPDX Headers:**

All source files in `packages/fusain/src/` must include the SPDX header:
```typescript
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Kaz Walker, Thermoquad
```

---

**Last Updated:** 2026-01-11

**Maintainer:** Kaz Walker
