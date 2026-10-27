"use client";

import { useEffect, useState } from "react";

import { messagingApi } from "@/lib/api/endpoints";

export function useThreadRealtime(threadId: number | null, enabled: boolean, refresh: () => void) {
  const [state, setState] = useState({ threadId, live: false, unavailable: false });

  useEffect(() => {
    if (!threadId || !enabled) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let connecting = false;
    let attempt = 0;
    let lastPong = 0;

    function schedule() {
      if (disposed || retry) return;
      setState({ threadId, live: false, unavailable: true });
      retry = setTimeout(() => {
        retry = undefined;
        void connect();
      }, Math.min(1000 * 2 ** Math.min(attempt++, 5), 30_000));
    }

    async function connect() {
      if (disposed || connecting || socket?.readyState === WebSocket.OPEN) return;
      connecting = true;
      const requestController = new AbortController();
      controller = requestController;
      deadline = setTimeout(() => {
        requestController.abort();
        socket?.close();
        connecting = false;
        schedule();
      }, 10_000);
      try {
        const { ticket, websocket_url } = await messagingApi.realtimeTicket(threadId as number, requestController.signal);
        if (disposed || requestController.signal.aborted) return;
        const url = new URL(websocket_url);
        if (!["ws:", "wss:"].includes(url.protocol) ||
            (window.location.protocol === "https:" && url.protocol !== "wss:") ||
            url.username || url.password || url.search || url.hash) throw new Error("Invalid realtime endpoint");
        const ws = new WebSocket(url.toString(), ["caretekk.chat.v1", `caretekk.ticket.${ticket}`]);
        socket = ws;
        ws.onopen = () => {
          if (disposed || socket !== ws) { ws.close(); return; }
          clearTimeout(deadline);
          connecting = false;
          attempt = 0;
          lastPong = Date.now();
          setState({ threadId, live: true, unavailable: false });
          refresh();
          heartbeat = setInterval(() => {
            if (Date.now() - lastPong > 30_000) { ws.close(); return; }
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
          }, 15_000);
        };
        ws.onmessage = (event) => {
          if (disposed || socket !== ws) return;
          try {
            if (JSON.parse(String(event.data)).type === "pong") { lastPong = Date.now(); return; }
          } catch { /* Invalid events cannot replace persisted HTTP message data. */ }
          refresh();
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
          if (socket !== ws) return;
          clearTimeout(deadline);
          clearInterval(heartbeat);
          socket = null;
          connecting = false;
          if (!disposed) { refresh(); schedule(); }
        };
      } catch {
        clearTimeout(deadline);
        connecting = false;
        schedule();
      }
    }

    function resume() {
      if (document.visibilityState === "hidden") return;
      refresh();
      if (socket?.readyState === WebSocket.OPEN && Date.now() - lastPong > 30_000) socket.close();
      if (!socket && !connecting) {
        clearTimeout(retry);
        retry = undefined;
        void connect();
      }
    }

    void connect();
    window.addEventListener("online", resume);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(retry);
      clearTimeout(deadline);
      clearInterval(heartbeat);
      socket?.close();
      window.removeEventListener("online", resume);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [threadId, enabled, refresh]);

  return state.threadId === threadId && enabled
    ? { liveConnected: state.live, realtimeUnavailable: state.unavailable }
    : { liveConnected: false, realtimeUnavailable: false };
}
