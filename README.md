# Run locally

Two Pure Data patches and two Python bridges run in parallel.

**1.** Open both patches in Pure Data and enable audio (`Media > Audio ON`):
- `patches/background.pd` — lobby background music (OSC UDP 8000)
- `patches/init_setup.pd` — spatial audio driven by player position (OSC UDP 8001)

**2.** Start both WebSocket / OSC bridges (requires `websockets` and `python-osc`):
```bash
python server.py          # ws://localhost:8765 → OSC UDP 8000
python server_spatial.py  # ws://localhost:8766 → OSC UDP 8001
```

**3.** Serve the project from the root directory:
```bash
python -m http.server 8000
```

Open `http://localhost:8000/lobby` in a Chromium-based browser.

> The HTTP server (TCP 8000), background music OSC (UDP 8000), and spatial audio OSC (UDP 8001) coexist without conflict — HTTP and OSC use different protocols on the same port number.

## Port map

| Component | WebSocket | OSC UDP |
|-----------|-----------|---------|
| Background music (`background.pd`) | 8765 | 8000 |
| Spatial audio (`init_setup.pd`) | 8766 | 8001 |

## VR support

WebXR requires a secure connection — tunnel the local server with `ngrok http 8000` and open the provided `https://` URL on the headset.

## References
- https://citate-fmi.tiddlyhost.com/
