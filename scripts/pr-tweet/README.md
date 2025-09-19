# PR Tweet Automation

This directory contains all the code for the automated PR tweet system.

## Structure

- **`types.ts`** - TypeScript interfaces and type definitions
- **`utils.ts`** - Utility functions for data extraction, validation, and IFTTT integration
- **`agents.ts`** - LLM agents for decision making and tweet generation

## Usage

These modules are imported by the main automation script at `../pr-tweet-automation.ts`.

## Dependencies

The automation uses:

- Vercel AI SDK for LLM integration
- OpenRouter for Claude Sonnet 4 access
- Zod for schema validation
- Native fetch API for IFTTT webhook calls

## Architecture

1. **Decision Agent** (`agents.ts`) - Analyzes PRs to determine tweet-worthiness
2. **Generation Agent** (`agents.ts`) - Creates human-sounding tweets
3. **Utilities** (`utils.ts`) - Handles data processing and external API calls
4. **Types** (`types.ts`) - Provides type safety across all modules
