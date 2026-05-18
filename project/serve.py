#!/usr/bin/env python3
"""Tiny dev server for the Medeo prototype.

Same shape as `python3 -m http.server`, but every response includes
no-cache headers so the browser never serves a stale `.jsx` / `.js` /
`.css` after we edit it. Run with: ``python3 serve.py [port]``
(default port 5173, bound to 127.0.0.1).
"""

from __future__ import annotations

import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:  # type: ignore[override]
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    host = "127.0.0.1"
    server = HTTPServer((host, port), NoCacheHandler)
    print(f"Serving prototype on http://{host}:{port} (no-cache mode)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
