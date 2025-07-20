# Ectoo

[![CI](https://github.com/xianyuntang/ectoo/actions/workflows/ci.yml/badge.svg)](https://github.com/xianyuntang/ectoo/actions/workflows/ci.yml)
[![Docker Build](https://github.com/xianyuntang/ectoo/actions/workflows/docker-build.yml/badge.svg)](https://github.com/xianyuntang/ectoo/actions/workflows/docker-build.yml)

Ectoo - A Next.js application for monitoring and controlling AWS EC2 instances.

## Features

- 🔐 Secure AWS credential management with browser-side encryption
- 🌍 Multi-region support
- 🚀 Real-time instance status monitoring
- ⚡ Start/Stop instance controls
- 🌓 Dark mode support
- 📱 Responsive design (desktop-first)

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v3
- shadcn/ui components
- AWS SDK for JavaScript
- Zustand for state management
- Tanstack Query for data fetching

## Getting Started

### Prerequisites

- Node.js 22.14.0 or higher
- npm or yarn
- AWS IAM user with EC2 permissions

### Development

```bash
# Install dependencies
npm install

# Run development server
npx nx dev web

# Build for production
npx nx build web

# Run linting
npx nx lint web
```

### Docker

```bash
# Build Docker image
docker build -f apps/web/Dockerfile -t ectoo:latest .

# Run with Docker
docker run -p 3000:3000 ectoo:latest

# Or use docker-compose
cd apps/web
docker-compose up -d
```

## Deployment

### GitHub Container Registry

Images are automatically built and pushed to GitHub Container Registry when pushing to the main branch:

```bash
docker pull ghcr.io/xianyuntang/ectoo:latest
```

## Required AWS Permissions

The IAM user must have the following EC2 permissions:
- `ec2:DescribeInstances`
- `ec2:StartInstances`
- `ec2:StopInstances`
- `ec2:DescribeRegions`

## Security

- AWS credentials are encrypted using Web Crypto API
- Credentials are stored in browser's localStorage
- No backend services or credential transmission
- Recommended to use IAM users with minimal required permissions

## GitHub Actions

This project is configured with automated CI/CD:

- **CI**: Runs linting, type checking, and builds on every push
- **Docker Build**: Automatically builds and pushes to ghcr.io on push to main
- **Release**: Creates releases and Docker images when version tags are created

See [.github/workflows/README.md](.github/workflows/README.md) for detailed information.

## License

This project is licensed under the MIT License.
