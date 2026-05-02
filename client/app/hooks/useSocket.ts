"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create the socket connection to our NestJS WebSocket gateway
    const socket = io(SERVER_URL, {
      transports: ["websocket"],   // Use WebSocket transport directly (skip polling)
      autoConnect: true,
    });

    socketRef.current = socket;

    // Track connection state
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    // Cleanup: disconnect socket when the component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
