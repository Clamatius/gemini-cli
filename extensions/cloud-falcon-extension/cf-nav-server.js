#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cloud Falcon Nav-Block Integration MCP Server
 * Detects nav-blocks and fetches memories from Cloud Falcon REST API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

class CloudFalconNavServer {
  constructor() {
    this.server = new Server(
      { name: 'cloud-falcon-nav', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    this.cfApiKey = process.env.CF_API_KEY;
    this.cfEndpoint = process.env.CF_ENDPOINT || 'https://api.cloudfalcon.io';
    this.clientId = process.env.CF_CLIENT_ID || 'ambler-gemini';
    this.lastNavBlock = null;
    this.memoryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'cf_nav_monitor',
          description:
            'Monitor for nav-blocks and inject Cloud Falcon memories',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Message content to scan for nav-blocks',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'cf_fetch_memories',
          description: 'Manually fetch memories from Cloud Falcon',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for Cloud Falcon',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results',
                default: 3,
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'cf_nav_monitor':
          return await this.handleNavMonitor(args.content);
        case 'cf_fetch_memories':
          return await this.handleFetchMemories(
            args.query,
            args.maxResults || 3,
          );
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleNavMonitor(content) {
    try {
      const navMatch = content.match(/<nav>(.*?)<\/nav>/s);

      if (!navMatch) {
        return {
          content: [
            {
              type: 'text',
              text: 'No nav-block detected in content.',
            },
          ],
        };
      }

      const navContent = navMatch[1].trim();

      // Skip if same as last nav-block (avoid redundant fetches)
      if (navContent === this.lastNavBlock) {
        return {
          content: [
            {
              type: 'text',
              text: 'Nav-block unchanged, using cached memories.',
            },
          ],
        };
      }

      this.lastNavBlock = navContent;
      const memories = await this.fetchMemoriesFromCF(navContent);

      if (memories && memories.length > 0) {
        await this.injectMemories(memories);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Injected ${memories.length} memories for nav-block: "${navContent}"`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ No memories found for nav-block: "${navContent}"`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Nav monitor error: ${error.message}`,
          },
        ],
      };
    }
  }

  async handleFetchMemories(query, maxResults) {
    try {
      const memories = await this.fetchMemoriesFromCF(query, maxResults);

      if (memories && memories.length > 0) {
        await this.injectMemories(memories);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Fetched and injected ${memories.length} memories for query: "${query}"`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ No memories found for query: "${query}"`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Fetch memories error: ${error.message}`,
          },
        ],
      };
    }
  }

  async fetchMemoriesFromCF(query, maxResults = 3) {
    if (!this.cfApiKey) {
      throw new Error('CF_API_KEY environment variable not set');
    }

    // Check cache first
    const cacheKey = `${query}-${maxResults}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.cfEndpoint}/search-librarian`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          query: query,
          lens_types: ['code', 'docs', 'conversations'],
          max_results: maxResults,
          conversation_id: `gemini-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `CF API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const memories = data.results || [];

      // Cache the results
      this.memoryCache.set(cacheKey, {
        data: memories,
        timestamp: Date.now(),
      });

      return memories;
    } catch (error) {
      throw new Error(`Failed to fetch memories: ${error.message}`);
    }
  }

  async injectMemories(memories) {
    try {
      const contextPath = path.join(os.tmpdir(), '.gemini-cf-memories.md');
      const formattedMemories = this.formatMemories(memories);

      await fs.writeFile(contextPath, formattedMemories, 'utf8');

      // Also write to workspace if available
      const workspacePath = path.join(process.cwd(), '.gemini-cf-memories.md');
      await fs.writeFile(workspacePath, formattedMemories, 'utf8').catch(() => {
        // Ignore errors if workspace write fails
      });
    } catch (error) {
      throw new Error(`Failed to inject memories: ${error.message}`);
    }
  }

  formatMemories(memories) {
    const timestamp = new Date().toISOString();
    let formatted = `# Cloud Falcon Memory Injection\n`;
    formatted += `Generated: ${timestamp}\n\n`;

    memories.forEach((memory, index) => {
      formatted += `## Memory ${index + 1}: ${memory.title || 'Untitled'}\n`;
      formatted += `**Tags**: ${(memory.tags || []).join(', ')}\n`;
      formatted += `**Temperature**: ${memory.temperature || 'Unknown'}\n`;
      formatted += `**Area**: ${memory.memory_area || 'Unknown'}\n\n`;
      formatted += `${memory.content || 'No content available'}\n\n`;
      formatted += `---\n\n`;
    });

    return formatted;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
const server = new CloudFalconNavServer();
server.run().catch(console.error);
