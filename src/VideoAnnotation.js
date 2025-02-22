'use client';
import React, { useRef, useState } from 'react';

export default function VideoAnnotation({ clientVideo, annotations, setAnnotations }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoContainerRef = useRef(null); // For scrolling to the main video
  const [currentNote, setCurrentNote] = useState("");
  const [comparisonMedia, setComparisonMedia] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  };

  const handleProgressChange = (e) => {
    const newTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setProgress(newTime);
  };

  const handleAddAnnotation = () => {
    if (videoRef.current && currentNote.trim() !== "") {
      const timestamp = videoRef.current.currentTime;
      const newAnnotation = { timestamp, note: currentNote, media: comparisonMedia };
      setAnnotations([...annotations, newAnnotation]);
      setCurrentNote("");
      setComparisonMedia(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setComparisonMedia(url);
    }
  };

  // For editing, we stop event propagation so the entire li click isn’t triggered.
  const handleEditAnnotation = (index, e) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingText(annotations[index].note);
  };

  const handleSaveEdit = (index, e) => {
    e.stopPropagation();
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].note = editingText;
    setAnnotations(updatedAnnotations);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleDeleteAnnotation = (index, e) => {
    e.stopPropagation();
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
    if (selectedAnnotation && updatedAnnotations[index] === selectedAnnotation) {
      setSelectedAnnotation(null);
    }
  };

  // When an annotation is clicked, update video time and scroll to the video.
  const handleAnnotationClick = (index) => {
    const ann = sortedAnnotations[index];
    if (videoRef.current) {
      videoRef.current.currentTime = ann.timestamp;
      videoRef.current.play().then(() => {
        setTimeout(() => {
          videoRef.current.pause();
        }, 100);
      });
    }
    setSelectedAnnotation(ann);
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Sort annotations by timestamp ascending.
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="video-annotation-container">
      <h2>Drill 1</h2>
      {clientVideo ? (
        <div className="video-container" ref={videoContainerRef}>
          <video
            ref={videoRef}
            controls={false} // using custom controls
            playsInline
            webkit-playsinline="true"
            muted
            className="client-video"
            poster="/path/to/preview.jpg"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => { setIsPlaying(true); setHasPlayed(true); }}
            onPause={() => setIsPlaying(false)}
          >
            <source src={clientVideo} type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
          <div className="video-controls">
            <button
              onClick={() => {
                if (videoRef.current.paused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              }}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            {hasPlayed && (
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={progress}
                onInput={handleProgressChange}
                onChange={handleProgressChange}
              />
            )}
            <button onClick={toggleFullScreen}>Fullscreen</button>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>No client submissions yet.</p>
      )}

      {clientVideo && (
        <>
          <div className="annotation-controls">
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Enter your annotation..."
            ></textarea>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            <button onClick={handleAddAnnotation}>Add Annotation</button>
          </div>
          <div className="annotation-list">
            <h3>Annotations:</h3>
            {sortedAnnotations.length === 0 ? (
              <p>No annotations added yet.</p>
            ) : (
              <ul>
                {sortedAnnotations.map((ann, index) => (
                  <li key={index} onClick={() => handleAnnotationClick(index)}>
                    <div className="annotation-content">
                      <strong>{ann.timestamp.toFixed(2)}s</strong>
                      <p>{ann.note}</p>
                    </div>
                    <div className="annotation-actions">
                      {editingIndex === index ? (
                        <>
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <button onClick={(e) => handleSaveEdit(index, e)}>Save</button>
                          <button onClick={(e) => setEditingIndex(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={(e) => handleEditAnnotation(index, e)}>Edit</button>
                          <button onClick={(e) => handleDeleteAnnotation(index, e)}>Delete</button>
                        </>
                      )}
                    </div>
                    {ann.media && (
                      <div className="attached-media">
                        <img src={ann.media} alt="Attached media" style={{ width: '80px', marginTop: '5px' }} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <style jsx>{`
        .video-annotation-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        h2 {
          text-align: center;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }
        .video-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .client-video {
          max-width: 50vw;
          max-height: 45vh;
          width: auto;
          height: auto;
          margin: 0 auto;
          display: block;
          border-radius: 20px;
        }
        .video-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          gap: 10px;
        }
        .video-controls button {
          padding: 6px 12px;
          font-size: 1rem;
          background: #0070f3;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .video-controls input[type="range"] {
          width: 50%;
        }
        .annotation-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        textarea {
          width: 100%;
          height: 80px;
          padding: 10px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        input[type="file"] {
          font-size: 1rem;
        }
        button {
          align-self: flex-start;
          padding: 8px 16px;
          font-size: 1rem;
          background: #0070f3;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        }
        button:hover {
          background: #005bb5;
        }
        .annotation-list ul {
          list-style-type: none;
          padding: 0;
        }
        .annotation-list li {
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 5px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: #f9f9f9;
        }
        .annotation-content {
          display: flex;
          flex-direction: column;
        }
        .annotation-actions {
          display: flex;
          gap: 5px;
        }
        .attached-media {
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
