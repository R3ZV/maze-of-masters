import asyncio
import websockets
import json
from pythonosc import udp_client

OSC_IP = "127.0.0.1"
OSC_PORT = 8000
client = udp_client.SimpleUDPClient(OSC_IP, OSC_PORT)

async def handler(websocket):
    print(f"Connected. Forwarding OSC to {OSC_IP}:{OSC_PORT}")
    try:
        async for message in websocket:
            data = json.loads(message)
            address = f"/{data['type']}"
            client.send_message(address, float(data['value']))
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        client.send_message("/lobbyVolume", 0.0)
        print("Disconnected. Sent lobbyVolume 0.")

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("WebSocket server listening on ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
