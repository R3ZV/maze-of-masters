# Run locally with VR support

We first server the project via `python3 -m http.server` on the root project
directory (it will serv on port `8000`).

WebXR needs a secure connection so for that we are going to use `ngrok` to tunnel
our local host to a secure web server via `ngrok http 8000`.

Also make sure you run a chromium based browser as they are the most reliable,
now you can go to `https://<domain-provided-by-ngrok>/lobby` to start the game.
