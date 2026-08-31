import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.open_llm_vtuber.mcpp.mcp_client import MCPClient
from src.open_llm_vtuber.mcpp.server_registry import ServerRegistry


async def main():
    client = MCPClient(ServerRegistry())
    try:
        print([tool.name for tool in await client.list_tools("ddg-search")])
        result = await client.call_tool(
            "ddg-search", "search", {"query": "OpenAI latest news 2026", "max_results": 3}
        )
        print(result["content_items"][0]["text"][:2000])
    finally:
        await client.aclose()


asyncio.run(main())
