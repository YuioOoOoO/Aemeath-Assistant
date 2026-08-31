"""Small, packaged-friendly web search MCP server.

Uses Bing's public RSS result format, avoiding the bot challenge frequently
returned by the former DuckDuckGo wrapper. No browser or API key is required.
"""

from __future__ import annotations

import html
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlencode

import httpx
from mcp.server.fastmcp import FastMCP


mcp = FastMCP("web-search")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
)


def _plain_text(value: str) -> str:
    value = re.sub(r"<script\b[^>]*>.*?</script>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<style\b[^>]*>.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


@mcp.tool()
async def search(query: str, max_results: int = 6) -> str:
    """Search the current web. Use this for recent, changing, or unknown facts.

    Args:
        query: Specific search terms. Include a date, place, or topic when useful.
        max_results: Number of results to return, between 1 and 10.
    """
    query = query.strip()
    if not query:
        return "Search query must not be empty."
    limit = max(1, min(int(max_results), 10))
    url = "https://www.bing.com/search?" + urlencode({"q": query, "format": "rss", "setlang": "zh-CN"})
    try:
        async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=12) as client:
            response = await client.get(url)
            response.raise_for_status()
        root = ET.fromstring(response.content)
        items = root.findall(".//item")[:limit]
        if not items:
            return f"No results found for: {query}"
        output = [f"Search results for: {query}"]
        for index, item in enumerate(items, 1):
            title = _plain_text(item.findtext("title") or "Untitled")
            link = (item.findtext("link") or "").strip()
            summary = _plain_text(item.findtext("description") or "")
            output.append(f"{index}. {title}\n   {link}\n   {summary}")
        return "\n\n".join(output)
    except Exception as exc:
        return f"Web search failed: {type(exc).__name__}: {exc}"


@mcp.tool()
async def fetch_content(url: str) -> str:
    """Fetch readable text from a search-result web page."""
    if not url.lower().startswith(("http://", "https://")):
        return "Only HTTP and HTTPS URLs are supported."
    try:
        async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=15) as client:
            response = await client.get(url)
            response.raise_for_status()
        text = _plain_text(response.text)
        return text[:16000] if text else "The page contained no readable text."
    except Exception as exc:
        return f"Page fetch failed: {type(exc).__name__}: {exc}"


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
