# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECToo - A Next.js application for monitoring and controlling AWS EC2 instances. The application allows users to view, start, and stop EC2 instances across different AWS regions using their AWS credentials.

## Development Commands

### Run development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Run linting
```bash
npm run lint          # Lint all projects
npm run lint:fix      # Lint with auto-fix
```

### Run type checking
```bash
npm run typecheck
```

### Run tests
```bash
npm test
```

### View all available commands
```bash
npx nx show project web
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

The application follows a client-side architecture where:
- AWS credentials are stored in encrypted localStorage
- AWS SDK for JavaScript (browser version) is used directly in the frontend
- No backend services are required

## Key Technical Decisions

1. **Authentication**: Direct AWS credential input (API Key and Secret) stored in browser
2. **State Management**: Zustand for global state
3. **Data Fetching**: Tanstack Query for caching and synchronization
4. **UI Components**: shadcn/ui with Tailwind CSS
5. **Form Handling**: React Hook Form with Zod validation

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

The EC2 instances must also have:
- SSM Agent installed and running
- An IAM role attached with AmazonSSMManagedInstanceCore policy

## Important Files

- `/spec.md` - Complete project specification
- `/apps/web/src/app/` - Next.js app directory
- `/apps/web/tailwind.config.js` - Tailwind configuration
- `/nx.json` - Nx workspace configuration