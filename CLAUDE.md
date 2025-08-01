# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECToo - A Next.js application for monitoring and controlling AWS EC2 instances. The application allows users to view, start, and stop EC2 instances across different AWS regions using their AWS credentials.

## Development Commands

### Run development server

```bash
npm run dev              # Runs all projects in dev mode
cd apps/web && npm run dev  # Run only web app on port 3333
```

### Build for production

```bash
npm run build            # Build all projects
cd apps/web && npm run build  # Build only web app
```

### Start production server

```bash
npm start                # Start all projects
cd apps/web && npm start  # Start only web app
```

### Run linting

```bash
npm run lint             # Lint all projects
npm run lint:fix         # Lint with auto-fix
cd apps/web && npm run lint  # Lint only web app
```

### Run type checking

```bash
npm run typecheck        # Type check all projects
cd apps/web && npm run typecheck  # Type check only web app
```

### Run tests

```bash
npm test                 # Run all tests
```

### Docker commands

```bash
# Build Docker image
docker build -f apps/web/Dockerfile -t ectoo:latest .

# Run with Docker
docker run -p 3000:3000 ectoo:latest

# Use docker-compose
cd apps/web && docker-compose up -d
```

### View all available commands

```bash
npx nx show project web  # Show all targets for web project
```

### Additional useful commands

```bash
# Clean build artifacts and cache
npm run clean

# Run commands only on affected projects
npm run affected:lint
npm run affected:build
npm run affected:test
```

## Project Architecture

This is an Nx monorepo with the following structure:

- `/apps/web/` - Main Next.js application
  - Uses Next.js 15 with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - shadcn/ui components

The application has two operational modes:

### Frontend Mode (Default)
- AWS credentials are stored in encrypted localStorage using Web Crypto API
- AWS SDK for JavaScript (browser version) is used directly in the frontend
- No backend services are required
- Credentials are encrypted/decrypted in `src/lib/crypto.ts`

### Backend Mode (Optional)
- Enabled by setting `NEXT_PUBLIC_USE_AWS_BACKEND=true` and providing AWS credentials in environment variables
- Uses API routes in `src/app/api/aws/` for all AWS operations
- AWS SDK runs server-side with centralized credentials
- Wrapper service in `src/lib/aws-service-wrapper.ts` automatically switches between modes

## Key Technical Decisions

1. **Authentication**: Direct AWS credential input (API Key and Secret) stored in browser
2. **State Management**: Zustand for global state with persistence (`src/store/useStore.ts`)
3. **Data Fetching**: Tanstack Query for caching and synchronization
4. **UI Components**: shadcn/ui with Tailwind CSS
5. **Form Handling**: React Hook Form with Zod validation
6. **Dual Mode Architecture**: Frontend-only mode (default) or backend API mode (optional)

## Important Component Structure

- `src/components/dashboard.tsx` - Main dashboard component
- `src/components/instances-view.tsx` - Handles table/grid view switching
- `src/components/instance-card.tsx` - Individual instance display
- `src/components/credentials-form.tsx` - AWS credential input
- `src/components/terminal-dialog.tsx` - SSM Session Manager integration
- `src/components/metrics-dialog.tsx` - CloudWatch metrics visualization
- `src/lib/aws-service.ts` - Frontend AWS SDK integration
- `src/lib/aws-service-backend.ts` - Backend AWS SDK integration
- `src/lib/aws-service-wrapper.ts` - Mode switching logic

## Required AWS IAM Permissions

The IAM user must have these EC2 permissions:

- ec2:DescribeInstances
- ec2:StartInstances
- ec2:StopInstances
- ec2:DescribeRegions
- ec2:ModifyInstanceAttribute
- ec2:DescribeInstanceTypes

For Session Manager (terminal connection) functionality:

- ssm:StartSession
- ssm:TerminateSession
- ssm:DescribeInstanceInformation

For CloudWatch metrics functionality:

- cloudwatch:GetMetricStatistics

The EC2 instances must also have:

- SSM Agent installed and running
- An IAM role attached with AmazonSSMManagedInstanceCore policy
- CloudWatch monitoring enabled for detailed metrics

## Important Files

- `/README.md` - Project documentation
- `/apps/web/src/app/` - Next.js app directory
- `/apps/web/tailwind.config.js` - Tailwind configuration
- `/nx.json` - Nx workspace configuration
- `/apps/web/.env` - Environment variables template
