# Cloud Falcon Navigation Configuration

This extension enables real-time memory injection from Cloud Falcon based on nav-block detection.

## Configuration

- **API Endpoint**: Uses CF_ENDPOINT environment variable or defaults to production
- **Client ID**: ambler-gemini  
- **Memory Areas**: code, docs, conversations
- **Max Results**: 3 memories per nav-block

## Usage

Embed nav-blocks in your messages:
```
<nav>typescript async patterns memory-injection</nav>
```

The extension will automatically fetch relevant memories from Cloud Falcon and inject them as context.

## Environment Variables

- `CF_API_KEY`: Your Cloud Falcon API key (required)
- `CF_ENDPOINT`: Cloud Falcon API endpoint (optional, defaults to production)
- `CF_CLIENT_ID`: Client identifier (optional, defaults to "ambler-gemini")