import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Draw({ clientVideo }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // State for drawing mode and functionality
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [showDrawingOptions, setShowDrawingOptions] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [drawingMode, setDrawingMode] = useState("free"); // "free" or "straight"
  const snapshotRef = useRef(null); // For straight-line drawing

  // On mount, attempt to request fullscreen for the video
  useEffect(() => {
    if (videoRef.current && clientVideo) {
      const vid = videoRef.current;
      if (vid.requestFullscreen) {
        vid.requestFullscreen().catch((err) => console.error(err));
      }
    }
  }, [clientVideo]);

  // Resize the canvas to match the video size
  useEffect(() => {
    const resizeCanvas = () => {
      if (videoRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = videoRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Utility: Get pointer coordinates (supports touch and mouse)
  const getEventPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (!drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    setLastPoint(pos);
    setDrawing(true);
    if (drawingMode === "straight" && canvasRef.current) {
      // Save current canvas content for previewing a straight line
      snapshotRef.current = canvasRef.current.toDataURL();
    }
  };

  const draw = (e) => {
    if (!drawing || !drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (drawingMode === "free") {
      // Free form drawing
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setLastPoint(pos);
    } else if (drawingMode === "straight") {
      // Straight line drawing: restore snapshot and draw line from starting point to current position
      const img = new Image();
      img.src = snapshotRef.current;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };
    }
  };

  const stopDrawing = (e) => {
    if (drawingEnabled) {
      e.preventDefault();
      setDrawing(false);
    }
  };

  // Clear the canvas (erase drawings)
  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Toggle video playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Back Button */}
      <button onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>
        Back
      </button>
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <video
          ref={videoRef}
          src={clientVideo}
          controls={false}
          autoPlay
          preload="auto"
          playsInline
          muted
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '20px'
          }}
          onClick={togglePlay}
        >
          <source src={clientVideo} type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: drawingEnabled ? 'auto' : 'none',
            borderRadius: '20px',
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Overlay for pencil and clear icons */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px'
        }}>
          {/* Pencil Icon Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDrawingOptions(prev => !prev);
            }}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              padding: '5px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            ✏️
          </button>
          {/* Dropdown Menu for Drawing Options */}
          {showDrawingOptions && (
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              padding: '5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawingMode("free");
                  setDrawingEnabled(true);
                  setShowDrawingOptions(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✍️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawingMode("straight");
                  setDrawingEnabled(true);
                  setShowDrawingOptions(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                📏
              </button>
            </div>
          )}
          {/* Trash Can Icon for Clearing Drawings */}
          <button
            onClick={(e) => { e.stopPropagation(); clearCanvas(); }}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              padding: '5px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            🗑️
          </button>
        </div>
        {/* Play/Pause Button at Bottom Center */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              padding: '10px 20px',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
