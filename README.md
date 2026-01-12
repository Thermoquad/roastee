# Roastee

Roastee is the Thermoquad PWA and TypeScript package monorepo.

## Structure

```
roastee/
├── packages/
│   └── fusain/           # TypeScript Fusain protocol implementation
└── (future: apps/)       # PWA application (not yet implemented)
```

## Requirements

- Node.js 22.x (managed via asdf)
- pnpm 10.x

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Using Taskfile

If you have [Task](https://taskfile.dev/) installed:

```bash
task install      # Install dependencies
task build        # Build all packages
task test         # Run tests
task ci           # Run CI checks
```

## Packages

### fusain

TypeScript implementation of the Fusain protocol.

```bash
npm install fusain
```

See [packages/fusain/README.md](packages/fusain/README.md) for details.

## License

This repository uses a dual-license structure:

- **Roastee monorepo** (this repository): GPL-2.0-or-later
- **fusain package** (`packages/fusain/`): Apache-2.0

The fusain package is licensed under Apache-2.0 to maintain compatibility with
the other Fusain implementations (C and Go) used in embedded systems.
