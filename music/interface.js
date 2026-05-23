export class WebPdSocket {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.ready = false;
    }

    async listen() {
        if (this.ready) return;
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                this.ws.onopen = () => { this.ready = true; resolve(); };
                this.ws.onclose = () => { this.ready = false; resolve(); };
                this.ws.onerror = () => { this.ready = false; resolve(); };
            } catch (e) {
                resolve();
            }
        });
    }

    send(type, value) {
        if (this.ready && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, value }));
        }
    }
}

export class SpatialAudioSocket {
    constructor(wsUrl) {
        this.ws = null;
        this.ready = false;
        try {
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => { this.ready = true; };
            this.ws.onclose = () => { this.ready = false; };
            this.ws.onerror = () => { this.ready = false; };
        } catch (e) {}
    }

    send(distances) {
        if (this.ready && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(distances));
        }
    }
}
