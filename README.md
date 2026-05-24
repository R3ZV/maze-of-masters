# Maze of Masters

In this game you spawn in a labyrinth and you have to find all the six masters
and complete their challanges.

Each master has a mini game based on their most iconic moments, throught
the mini games you will find quotes from several of them, so try to beat
as many levels as possible to unlock all the [quotes](https://citate-fmi.tiddlyhost.com/).


| Scene            | Camera | Controls |
| ---------------- | ------ | -------- |
| Dragon's lair    | ✅     | ❌       |
| Match the Sipos  | ✅     | ✅       |
| Paul's shop      | ✅     | ✅       |
| Rusu's radio     | ✅     | ❌       |
| Paun's room      | ✅     | ❌       |
| Chirita's rocket | ❌     | ❌       |

# Stack

- We are using PD to generate the background music for the lobby
- Three.js as a base layer for rendering
- Webxr it is enabled as part of the Three.js addons
- Python3 to serve the pd data to the webserver

# Run locally

Two Pure Data patches and two Python bridges run in parallel.

**1.** Open both patches in Pure Data and enable audio (`Media > Audio ON`):
- `patches/background.pd` — lobby background music (OSC UDP 8000)
- `patches/init_setup.pd` — spatial audio driven by player position (OSC UDP 8001)

**2.** Start both WebSocket / OSC bridges (requires `websockets` and `python-osc`):
You need [uv](https://docs.astral.sh/uv/) installed or if you have the packages on your machine
just run them without `uv`.
```bash
uv run python3 server.py          # ws://localhost:8765 → OSC UDP 8000
uv run python3 server_spatial.py  # ws://localhost:8766 → OSC UDP 8001
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

WebXR requires a secure connection — tunnel the local server with `ngrok http 8000`
and open the provided `https://` URL on a device that supports vr, such as a vr
headset or even your phone.

# Demo playthrough
A live demo of the gameplay can be downloaded <a href="https://we.tl/t-Xzkeb6SbaWwDFwAQ">here</a>. 
