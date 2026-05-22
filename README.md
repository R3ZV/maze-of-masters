# Run locally

**1.** Open `patches/background.pd` in Pure Data and enable audio (`Media > Audio ON`).

**2.** Start the WebSocket / OSC bridge (requires `websockets` and `python-osc`):
```bash
python server.py
```

**3.** Serve the project from the root directory:
```bash
python -m http.server 8000
```

Open `http://localhost:8000/lobby` in a Chromium-based browser.

## VR support

WebXR needs a secure connection — tunnel the local server with `ngrok http 8000` and open the provided `https://` URL on the headset.

## References
- https://citate-fmi.tiddlyhost.com/
