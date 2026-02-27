# MCP servers

- **svelte** – Cursor starts via `deno run` (stdio).
- **voltaire** – Cursor starts via `deno run` (stdio).
- **webmcp** – Connects to the MCP-B native server over HTTP. The server must be running before Cursor connects.

## webmcp (MCP-B / WebMCP)

The MCP-B native server is HTTP-only (port 12306), so it cannot be started by Cursor as a stdio subprocess. Start it yourself, then Cursor will use the `url` in `mcp.json`:

```bash
deno task dev:webmcp
```

Keep that terminal open. With the MCP-B extension enabled in Brave and your app open in a tab, Cursor can call your app’s WebMCP tools.
