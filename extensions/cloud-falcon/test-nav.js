#!/usr/bin/env node

/**
 * Test script for nav-block detection
 */

function testNavBlockDetection() {
  const testContent = `
Hello, I need help with <nav>typescript async patterns memory-injection</nav> implementation.

Also, could you explain <nav>gemini-cli extension architecture</nav> concepts?

This message has no nav-blocks.
  `;

  const navRegex = /<nav>(.*?)<\/nav>/gs;
  const matches = [];
  let match;

  while ((match = navRegex.exec(testContent)) !== null) {
    matches.push(match[1].trim());
  }

  console.log('Nav-blocks detected:');
  matches.forEach((nav, index) => {
    console.log(`  ${index + 1}: "${nav}"`);
  });

  return matches;
}

function testMemoryFormatting() {
  const mockMemories = [
    {
      title: 'TypeScript Async Patterns',
      tags: ['typescript', 'async', 'patterns'],
      temperature: 'HOT',
      memory_area: 'code',
      content: '# TypeScript Async Patterns\n\nAsync/await patterns for TypeScript...'
    },
    {
      title: 'Gemini CLI Architecture',
      tags: ['gemini-cli', 'architecture'],
      temperature: 'WARM',
      memory_area: 'docs',
      content: '# Gemini CLI Architecture\n\nThe CLI is built with...'
    }
  ];

  const formatted = formatMemories(mockMemories);
  console.log('\nFormatted memories:');
  console.log(formatted);
}

function formatMemories(memories) {
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

console.log('Testing Cloud Falcon Nav Extension...\n');
testNavBlockDetection();
testMemoryFormatting();