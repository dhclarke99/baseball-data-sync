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

  // UI visibility during drawing
  const [showUI, setShowUI] = useState(true);

  // Video timeline state
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Refs to store drawn segments and in-progress segment
  const segmentsRef = useRef([]); // Completed segments
  const currentSegmentRef = useRef(null); // In-progress segment

  // Recording state and ref
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const mediaRecorderRef = useRef(null);

  // On mount, request fullscreen for the video
  useEffect(() => {
    if (videoRef.current && clientVideo) {
      const vid = videoRef.current;
      if (vid.requestFullscreen) {
        vid.requestFullscreen().catch((err) => console.error(err));
      }
    }
  }, [clientVideo]);

  // Resize the canvas to match video size
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

  // Get pointer coordinates (supports touch and mouse)
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

  // Draw an individual segment based on its mode
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
        // Calculate and display the angle
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
    segmentsRef.current.forEach(segment => {
      drawSegment(segment);
    });
    if (currentSegmentRef.current) {
      drawSegment(currentSegmentRef.current);
    }
  };

  // Drawing event handlers
  const startDrawing = (e) => {
    if (!drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    setDrawing(true);
    setShowUI(false);
    currentSegmentRef.current = { mode: drawingMode, points: [pos] };
  };

  const draw = (e) => {
    if (!drawing || !drawingEnabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    if (!currentSegmentRef.current) return;
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

  const stopDrawing = (e) => {
    if (drawingEnabled) {
      e.preventDefault();
      setDrawing(false);
      if (currentSegmentRef.current) {
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

  // Voice-over recording functions
  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      const options = { mimeType: 'video/webm' };
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;
      let chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
      };
      setIsRecording(true);
      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Save recording and navigate to VideoAnnotation.js screen
  const saveRecording = () => {
    if (recordedVideo) {
      navigate('/video-annotation', { state: { recordedVideo } });
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
        {showUI && (
          <>
            {/* Recording Controls (Top Left) */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 3,
              display: 'flex',
              gap: '10px'
            }}>
              {!isRecording && (
                <button onClick={startRecording} style={{ padding: '5px 10px' }}>
                  Start Recording
                </button>
              )}
              {isRecording && (
                <button onClick={stopRecording} style={{ padding: '5px 10px' }}>
                  Stop Recording
                </button>
              )}
            </div>
            {/* Overlay for Drawing Options */}
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
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setDrawingMode("free");
                    setDrawingEnabled(true);
                    setShowDrawingOptions(false);
                  }} style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}>
                    ✍️
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setDrawingMode("straight");
                    setDrawingEnabled(true);
                    setShowDrawingOptions(false);
                  }} style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}>
                    📏
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setDrawingMode("arrow");
                    setDrawingEnabled(true);
                    setShowDrawingOptions(false);
                  }} style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}>
                    ➡️
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setDrawingMode("circle");
                    setDrawingEnabled(true);
                    setShowDrawingOptions(false);
                  }} style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}>
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
      {/* Video Preview Modal */}
      {recordedVideo && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <video 
            controls 
            autoPlay 
            src={URL.createObjectURL(recordedVideo)} 
            style={{ maxWidth: '90%', maxHeight: '70%' }} 
          />
          <div style={{ marginTop: '20px' }}>
            <button onClick={saveRecording} style={{ padding: '5px 10px', marginRight: '10px' }}>
              Save Recording
            </button>
            <button onClick={() => setRecordedVideo(null)} style={{ padding: '5px 10px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
