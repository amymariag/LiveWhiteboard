const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());

let connections = [];

wss.on("connection", (ws) => {
  connections.push(ws);

  ws.on("message", (message) => {
    connections.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    connections = connections.filter((client) => client !== ws);
  });
});

server.listen(4000, () => {
  console.log("WebSocket server running on port 4000");
});

// 2️⃣ Frontend (React + Canvas API + WebSockets)
// Save as App.js
import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = new WebSocket("ws://localhost:4000");

const App = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctxRef.current = ctx;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      drawLine(data);
    };
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    
    socket.send(JSON.stringify({ offsetX, offsetY }));
  };

  const endDrawing = () => {
    setDrawing(false);
    ctxRef.current.closePath();
  };

  const drawLine = ({ offsetX, offsetY }) => {
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  return (
    <div className="container">
      <h1>Live Whiteboard</h1>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
      />
    </div>
  );
};

export default App;
