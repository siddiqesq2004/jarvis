"""
Vercel Serverless Entrypoint for laptop-agent service.
Provides cloud health check and explains that physical laptop automation runs on the user's PC.
"""
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "service": "laptop-agent",
            "status": "online",
            "runtime": "vercel-python",
            "message": "Jarvis Laptop Agent Cloud Service is healthy. Active Windows laptop automation connects via outbound heartbeats."
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
