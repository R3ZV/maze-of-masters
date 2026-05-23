import asyncio
import websockets
import json
from pythonosc import udp_client

OSC_IP = "127.0.0.1"
OSC_PORT = 8001
client = udp_client.SimpleUDPClient(OSC_IP, OSC_PORT)

async def handler(websocket):
    print(f"Connected. Forwarding spatial OSC to {OSC_IP}:{OSC_PORT}")
    try:
        async for message in websocket:
            data = json.loads(message)
            if isinstance(data, list):
                for obj in data:
                    client.send_message(f"/obj/{obj['id']}", float(obj['dist']))
            elif isinstance(data, dict):
                client.send_message(f"/{data['type']}", float(data['value']))
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        client.send_message("/spatialVolume", 0.0)
        print("Disconnected. Sent spatialVolume 0.")

async def main():
    async with websockets.serve(handler, "localhost", 8766):
        print("Spatial audio WebSocket listening on ws://localhost:8766")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
