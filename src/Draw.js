import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Draw({ clientVideo }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Modes: "free", "straight", "arrow", "circle"
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [showDrawingOptions, setShowDrawingOptions] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [drawingMode, setDrawingMode] = useState("free");

  // State for controlling UI visibility during drawing (for unobstructed view)
  const [showUI, setShowUI] = useState(true);

  // State for video timeline
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Refs to store drawn segments and the segment in progress
  const segmentsRef = useRef([]); // Completed segments
  const currentSegmentRef = useRef(null); // In-progress segment

  // On mount, attempt to request fullscreen for the video
  useEffect(() => {
    if (videoRef.current && clientVideo) {
      const vid = videoRef.current;
      if (vid.requestFullscreen) {
        vid.requestFullscreen().catch((err) => console.error(err));
      }
    }
  }, [clientVideo]);

  // Resize canvas to match video size
  useEffect(() => {
    const resizeCanvas = () => {
      if (videoRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = videoRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        redrawCanvas();
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

  // Function to draw an individual segment based on its mode
  const drawSegment = (segment) => {
    const ctx = canvasRef.current.getContext("2d");
    if (segment.mode === "free") {
      ctx.beginPath();
      segment.points.forEach((pt, index) => {
        index === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    } else if (segment.mode === "straight") {
      if (segment.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        ctx.lineTo(segment.points[1].x, segment.points[1].y);
        ctx.stroke();
        // Calculate and display angle label
        const start = segment.points[0];
        const end = segment.points[1];
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        angle = Math.abs(angle);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "yellow";
        ctx.fillText(`${Math.round(angle)}°`, start.x + 10, start.y - 10);
      }
    } else if (segment.mode === "arrow") {
      if (segment.points.length >= 2) {
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        ctx.lineTo(segment.points[1].x, segment.points[1].y);
        ctx.stroke();
        // Draw arrowhead
        const start = segment.points[0];
        const end = segment.points[1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6; // 30 degrees
        const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(arrowX1, arrowY1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(arrowX2, arrowY2);
        ctx.stroke();
      }
    } else if (segment.mode === "circle") {
      if (segment.points.length >= 2) {
        const center = segment.points[0];
        const edge = segment.points[1];
        const dx = edge.x - center.x;
        const dy = edge.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // Redraw the entire canvas
  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;

    // Draw completed segments
    segmentsRef.current.forEach(segment => {
      drawSegment(segment);
    });

    // Draw the current segment if it exists
    if (currentSegmentRef.current) {
      drawSegment(currentSegmentRef.current);
    }
  };

  // When drawing starts, hide UI for unobstructed view
  const startDrawing = (e) => {
    if (!drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    setDrawing(true);
    setShowUI(false);
    // Start a new segment with the initial point
    currentSegmentRef.current = { mode: drawingMode, points: [pos] };
  };

  const draw = (e) => {
    if (!drawing || !drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    if (!currentSegmentRef.current) return;
    // For free mode, add every point; for others, update the second point
    if (drawingMode === "free") {
      currentSegmentRef.current.points.push(pos);
    } else {
      if (currentSegmentRef.current.points.length === 1) {
        currentSegmentRef.current.points.push(pos);
      } else {
        currentSegmentRef.current.points[1] = pos;
      }
    }
    redrawCanvas();
  };

  // When drawing stops, restore UI and finalize the segment
  const stopDrawing = (e) => {
    if (drawingEnabled) {
      e.preventDefault();
      setDrawing(false);
      if (currentSegmentRef.current) {
        // For modes other than free, ensure there is a second point
        if (drawingMode !== "free" && currentSegmentRef.current.points.length < 2) {
          currentSegmentRef.current = null;
        } else {
          segmentsRef.current.push(currentSegmentRef.current);
          currentSegmentRef.current = null;
        }
        setShowUI(true);
        redrawCanvas();
      }
    }
  };

  const undoLastSegment = () => {
    if (segmentsRef.current.length > 0) {
      segmentsRef.current.pop();
      redrawCanvas();
    }
  };

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
      {/* Back Button remains visible */}
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
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setVideoDuration(videoRef.current.duration);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setVideoTime(videoRef.current.currentTime);
            }
          }}
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
        {showUI && (
          <>
            {/* Overlay for drawing options and controls */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '10px'
            }}>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawingMode("arrow");
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
                    ➡️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawingMode("circle");
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
                    ⭕
                  </button>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); undoLastSegment(); }}
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
            {/* Slider for video navigation */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              zIndex: 2
            }}>
              <input
                type="range"
                min="0"
                max={videoDuration}
                step="0.1"
                value={videoTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                  }
                  setVideoTime(newTime);
                }}
                style={{ width: '100%' }}
              />
            </div>
            {/* Play/Pause Button */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
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
          </>
        )}
      </div>
    </div>
  );
}
