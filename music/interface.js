import {WebPdWorkletNode, registerWebPdWorkletNode } from 'runtime'; 

export class WebPdSocket {
    constructor(path) {
        this.node = null;
        this.path = path;
        this.ready = false;
    }

    async listen() {
        if (this.ready) return;
         
        const ctx = new AudioContext();
        await ctx.resume();
       
        await registerWebPdWorkletNode(ctx);

        const response = await fetch(this.path);
        const code = await response.text();

        this.node = new WebPdWorkletNode(ctx);
        this.node.port.postMessage({ type: 'code:JS', payload: { jsCode: code } });
        this.node.connect(ctx.destination);

        this.ready = true;
        console.log("[INFO]: two nil to the arsenal");
    }

    send(receiver, value) {
        if (this.ready) {
            this.node.port.postMessage({
                type: 'inletCaller',
                payload: { nodeId: receiver, portletId: '0', message: [value] }
            });
        }
    }
}