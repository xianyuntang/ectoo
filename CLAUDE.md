# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS EC2 VM Monitor - A Next.js application for monitoring and controlling AWS EC2 instances. The application allows users to view, start, and stop EC2 instances across different AWS regions using their AWS credentials.

## Development Commands

### Run development server
```bash
npx nx dev vm-monitor
```

### Build for production
```bash
npx nx build vm-monitor
```

### Start production server
```bash
npx nx start vm-monitor
```

### Run linting
```bash
npx nx lint vm-monitor
```

### View all available commands
```bash
npx nx show project vm-monitor
```

## Project Architecture

This is an Nx monorepo with the following structure:

- `/apps/vm-monitor/` - Main Next.js application
  - Uses Next.js 15 with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - shadcn/ui components (to be integrated)

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

## Important Files

- `/spec.md` - Complete project specification
- `/apps/vm-monitor/src/app/` - Next.js app directory
- `/apps/vm-monitor/tailwind.config.js` - Tailwind configuration
- `/nx.json` - Nx workspace configuration