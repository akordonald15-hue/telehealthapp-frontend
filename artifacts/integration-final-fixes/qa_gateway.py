"""Local TCP pass-through for HTTP/WebSocket QA; no fabricated API responses."""
import select
import socket
import socketserver


class Gateway(socketserver.BaseRequestHandler):
    def handle(self):
        with socket.create_connection(("backend", 8000), timeout=10) as upstream:
            upstream.settimeout(None)
            peers = [self.request, upstream]
            while True:
                ready, _, _ = select.select(peers, [], [], 120)
                if not ready:
                    return
                for peer in ready:
                    data = peer.recv(65536)
                    if not data:
                        return
                    (upstream if peer is self.request else self.request).sendall(data)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(("0.0.0.0", 8080), Gateway) as server:
    server.serve_forever()
