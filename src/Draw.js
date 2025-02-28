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
  const [isPlaying, setIsPlaying] = useState(false);
  const [drawingMode, setDrawingMode] = useState("free"); // "free" or "straight"

  // State for video timeline
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Refs to store drawn segments and the segment in progress
  const segmentsRef = useRef([]); // Array of completed segments
  const currentSegmentRef = useRef(null); // Current segment being drawn

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
        // Redraw the segments when the canvas size changes
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

  // Redraw the canvas from saved segments and the current in-progress segment
  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;

    // Draw all completed segments
    segmentsRef.current.forEach(segment => {
      ctx.beginPath();
      if (segment.mode === "free") {
        segment.points.forEach((pt, index) => {
          if (index === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
      } else if (segment.mode === "straight" && segment.points.length === 2) {
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        ctx.lineTo(segment.points[1].x, segment.points[1].y);
      }
      ctx.stroke();
    });

    // Draw the current segment (if any) for live preview
    if (currentSegmentRef.current) {
      ctx.beginPath();
      if (currentSegmentRef.current.mode === "free") {
        currentSegmentRef.current.points.forEach((pt, index) => {
          if (index === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
      } else if (currentSegmentRef.current.mode === "straight" && currentSegmentRef.current.points.length === 2) {
        ctx.moveTo(currentSegmentRef.current.points[0].x, currentSegmentRef.current.points[0].y);
        ctx.lineTo(currentSegmentRef.current.points[1].x, currentSegmentRef.current.points[1].y);
      }
      ctx.stroke();
    }
  };

  const startDrawing = (e) => {
    if (!drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    setDrawing(true);
    // Start a new segment with the initial point
    currentSegmentRef.current = { mode: drawingMode, points: [pos] };
  };

  const draw = (e) => {
    if (!drawing || !drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    if (!currentSegmentRef.current) return;

    if (drawingMode === "free") {
      // For free drawing, add the new point to the current segment
      currentSegmentRef.current.points.push(pos);
    } else if (drawingMode === "straight") {
      // For straight mode, update or add the second point for preview
      if (currentSegmentRef.current.points.length === 1) {
        currentSegmentRef.current.points.push(pos);
      } else {
        currentSegmentRef.current.points[1] = pos;
      }
    }
    redrawCanvas();
  };

  const stopDrawing = (e) => {
    if (drawingEnabled) {
      e.preventDefault();
      setDrawing(false);
      if (currentSegmentRef.current) {
        // For straight mode, ensure we have a complete segment (start and end)
        if (drawingMode === "straight" && currentSegmentRef.current.points.length < 2) {
          currentSegmentRef.current = null;
        } else {
          // Save the completed segment
          segmentsRef.current.push(currentSegmentRef.current);
          currentSegmentRef.current = null;
        }
        redrawCanvas();
      }
    }
  };

  // Undo the most recent drawn segment
  const undoLastSegment = () => {
    if (segmentsRef.current.length > 0) {
      segmentsRef.current.pop();
      redrawCanvas();
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
        {/* Overlay for pencil and trash can icons */}
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
          {/* Trash Can Icon for Undoing the Last Segment */}
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
        {/* Slider for Video Navigation */}
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
        {/* Play/Pause Button at Bottom Center */}
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
      </div>
    </div>
  );
}
