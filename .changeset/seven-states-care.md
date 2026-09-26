---
"@tui-sandbox/library": patch
---

refactor: remove unnecessary keepAlive interval in TerminalApplication

It was needed because of a bug in zigpty, but that has been fixed in
https://github.com/pithings/zigpty/releases/tag/v0.2.0
