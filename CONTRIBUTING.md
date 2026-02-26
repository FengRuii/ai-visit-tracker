# Contributing

The most impactful contribution is **adding new AI agents** to `agents.json`.

## Adding an Agent

1. Fork the repo
2. Add the agent to `agents.json`:
   ```json
   "MyBot": ["MyBot", "mybot/"]
   ```
   - Key = canonical display name shown in stats
   - Values = substrings matched case-insensitively in the User-Agent header
3. Open a PR with a link to the bot's documentation or `robots.txt` entry

## Finding User-Agent Strings

Check your server logs for unfamiliar bot strings, or look at:
- The bot's official documentation
- `https://useragentstring.com`
- Common crawl reports
