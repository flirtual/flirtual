import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

import deepdanbooru as dd

PROJECT_PATH = os.environ.get("DD_PROJECT_PATH", "deep-danbooru")
THRESHOLD = float(os.environ.get("DD_THRESHOLD", "0.5"))
HOST = os.environ.get("DD_HOST", "127.0.0.1")
PORT = int(os.environ.get("DD_PORT", "5001"))

print(f"[deepdanbooru] loading model from {PROJECT_PATH}...", flush=True)
_model = dd.project.load_model_from_project(PROJECT_PATH, compile_model=False)
_tags = dd.project.load_tags_from_project(PROJECT_PATH)
_lock = threading.Lock()
print("[deepdanbooru] model ready.", flush=True)


def evaluate(path):
    with _lock:
        return {
            tag: float(score)
            for tag, score in dd.commands.evaluate_image(path, _model, _tags, THRESHOLD)
        }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/evaluate":
            self._send(404, {"error": "not found"})
            return

        try:
            length = int(self.headers.get("content-length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
            path = payload.get("path")

            if not path or not os.path.isfile(path):
                self._send(400, {"error": "missing or invalid path"})
                return

            self._send(200, evaluate(path))
        except Exception as reason:
            print(f"[deepdanbooru] evaluate failed: {reason}", file=sys.stderr, flush=True)
            self._send(500, {"error": str(reason)})

    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[deepdanbooru] listening on {HOST}:{PORT}", flush=True)
    server.serve_forever()
