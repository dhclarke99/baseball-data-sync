'use client';
import React, { useRef, useState } from 'react';

export default function ClientView() {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  // In a real app, annotations would come from your backend.
  // For this example, we start with an empty list.
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  // Handle video file import
  const handleVideoImport = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  // Handle clicking on an annotation to jump the video and show details
  const handleAnnotationClick = (index) => {
    const ann = annotations[index];
    if (videoRef.current) {
      videoRef.current.currentTime = ann.timestamp;
      videoRef.current.pause();
    }
    setSelectedAnnotation(ann);
  };

  return (
    <div className="client-view-container">
      <h2>Client Video Review</h2>
      
      {/* Video Import */}
      <div className="video-import">
        <input type="file" accept="video/*" onChange={handleVideoImport} />
      </div>
      
      {/* Main Video Player */}
      <div className="video-container">
        {videoSrc ? (
          <video ref={videoRef} controls width="600">
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <p>No video selected. Please import a video.</p>
        )}
      </div>

      {/* Annotation List */}
      <div className="annotation-list">
        <h3>Annotations:</h3>
        {annotations.length === 0 ? (
          <p>No annotations available.</p>
        ) : (
          <ul>
            {annotations.map((ann, index) => (
              <li key={index}>
                <span
                  onClick={() => handleAnnotationClick(index)}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                >
                  {ann.timestamp.toFixed(2)}s
                </span>
                <p>{ann.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* If an annotation is selected and has comparison media, show it side by side */}
      {selectedAnnotation && selectedAnnotation.media && (
        <div className="media-detail">
          <img src={selectedAnnotation.media} alt="Comparison" width="300" />
          <div className="annotation-notes">
            <h3>Annotation Details</h3>
            <p><strong>Time:</strong> {selectedAnnotation.timestamp.toFixed(2)}s</p>
            <p><strong>Note:</strong> {selectedAnnotation.note}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .client-view-container {
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
        .video-import {
          text-align: center;
          margin-bottom: 10px;
        }
        .video-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .annotation-list ul {
          list-style-type: none;
          padding: 0;
        }
        .annotation-list li {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .media-detail {
          display: flex;
          flex-direction: row;
          overflow-x: auto;
          gap: 10px;
          align-items: center;
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .annotation-notes {
          text-align: center;
        }
        .annotation-notes h3 {
          font-size: 1.2rem;
          margin-bottom: 5px;
        }
        .annotation-notes p {
          font-size: 0.9rem;
          margin: 3px 0;
        }
      `}</style>
    </div>
  );
}
