# Cloud Falcon Nav-Block Extension for Gemini CLI

This extension enables real-time memory injection from Cloud Falcon based on nav-block detection in conversations.

## Quick Start

1. **Install Dependencies** (already done if you're reading this):

   ```bash
   cd ~/.gemini/extensions/cloud-falcon
   npm install
   ```

2. **Set Environment Variables**:

   ```bash
   export CF_API_KEY="your-cloud-falcon-api-key"
   export CF_ENDPOINT="https://api.cloudfalcon.io"  # optional
   export CF_CLIENT_ID="ambler-gemini"              # optional
   ```

3. **Start Gemini CLI** - the extension will be automatically loaded

4. **Use Nav-Blocks** in your conversations:
   ```
   I need help with <nav>typescript async patterns memory-injection</nav> implementation.
   ```

## How It Works

### Nav-Block Detection

The extension monitors conversation content for nav-blocks using the pattern:

```
<nav>search-keywords memory-concepts</nav>
```

### Memory Fetching

When a nav-block is detected, the extension:

1. Extracts the search keywords
2. Calls Cloud Falcon's search-librarian API
3. Fetches up to 3 relevant memories
4. Injects them as context files

### Memory Injection

Memories are written to temporary files that Gemini CLI's file discovery picks up:

- `/tmp/.gemini-cf-memories.md` (system temp)
- `./.gemini-cf-memories.md` (workspace, if writable)

## MCP Tools Available

### `cf_nav_monitor`

Automatically called to monitor message content for nav-blocks.

**Parameters:**

- `content` (string): Message content to scan

**Example:**

```json
{
  "name": "cf_nav_monitor",
  "arguments": {
    "content": "Help with <nav>typescript patterns</nav>"
  }
}
```

### `cf_fetch_memories`

Manually fetch memories from Cloud Falcon.

**Parameters:**

- `query` (string): Search query
- `maxResults` (number, optional): Max results (default: 3)

**Example:**

```json
{
  "name": "cf_fetch_memories",
  "arguments": {
    "query": "typescript async patterns",
    "maxResults": 5
  }
}
```

## Configuration

### Environment Variables

- **`CF_API_KEY`** (required): Your Cloud Falcon API key
- **`CF_ENDPOINT`** (optional): API endpoint (default: https://api.cloudfalcon.io)
- **`CF_CLIENT_ID`** (optional): Client identifier (default: "ambler-gemini")

### Extension Configuration

Edit `gemini-extension.json` to modify:

- MCP server command/args
- Context file name
- Additional settings

## Architecture

```
User Message with <nav>keywords</nav>
         ↓
Gemini CLI processes message
         ↓
MCP calls cf_nav_monitor tool
         ↓
Extension detects nav-block
         ↓
HTTP POST to Cloud Falcon API
         ↓
Memories formatted and written to temp files
         ↓
Gemini CLI file discovery picks up context
         ↓
Enhanced conversation with injected memories
```

## Troubleshooting

### Extension Not Loading

1. Check `~/.gemini/extensions/cloud-falcon/gemini-extension.json` exists
2. Verify Node.js dependencies: `npm install`
3. Test MCP server: `node cf-nav-server.js` (should start without errors)

### No Memories Retrieved

1. Verify `CF_API_KEY` environment variable is set
2. Check Cloud Falcon API endpoint is accessible
3. Review query terms - use domain-specific keywords
4. Check API key permissions for search-librarian endpoint

### Memory Injection Not Working

1. Check file permissions for temp directory writes
2. Verify Gemini CLI file discovery is enabled
3. Look for `.gemini-cf-memories.md` files being created
4. Check MCP tool execution logs

### Debug Mode

Enable debug logging:

```bash
export DEBUG=cf-nav:*
gemini --debug
```

## Cache Behavior

- Memories are cached for 5 minutes per unique query
- Same nav-block content won't trigger redundant API calls
- Cache is in-memory only (resets on extension restart)

## File Structure

```
~/.gemini/extensions/cloud-falcon/
├── gemini-extension.json    # Extension configuration
├── CF_NAV_CONFIG.md        # Documentation and config
├── cf-nav-server.js        # Main MCP server
├── package.json           # Node.js dependencies
├── test-nav.js            # Testing utilities
└── README.md              # This file
```

## Future Enhancements

- [ ] UI indicators when memories are loaded
- [ ] Configurable cache timeout
- [ ] Multiple memory area selection
- [ ] Workspace-specific configuration
- [ ] Memory relevance scoring display
- [ ] Integration with other MCP servers

## Contributing

This extension follows AC-Ambler's "minimal intrusion, maximum value" philosophy. Changes should:

- Maintain compatibility with Gemini CLI updates
- Use existing extension points rather than core modifications
- Follow TypeScript/Node.js best practices
- Include tests for new functionality

---

_"The best code is the code you don't have to maintain when upstream updates."_
