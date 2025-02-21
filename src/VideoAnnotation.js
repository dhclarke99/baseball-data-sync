'use client';
import React, { useRef, useState } from 'react';

export default function VideoAnnotationMVP() {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [comparisonMedia, setComparisonMedia] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  // Handle video file import
  const handleVideoImport = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  // Handle adding a new annotation
  const handleAddAnnotation = () => {
    if (videoRef.current && currentNote.trim() !== "") {
      const timestamp = videoRef.current.currentTime;
      const newAnnotation = { timestamp, note: currentNote, media: comparisonMedia };
      setAnnotations([...annotations, newAnnotation]);
      setCurrentNote("");
      setComparisonMedia(null);
    }
  };

  // Handle file selection for comparison media (image/video)
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setComparisonMedia(url);
    }
  };

  // Start editing an annotation
  const handleEditAnnotation = (index) => {
    setEditingIndex(index);
    setEditingText(annotations[index].note);
  };

  // Save the edited annotation
  const handleSaveEdit = (index) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].note = editingText;
    setAnnotations(updatedAnnotations);
    setEditingIndex(null);
    setEditingText("");
  };

  // Delete an annotation
  const handleDeleteAnnotation = (index) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
    if (selectedAnnotation && updatedAnnotations[index] === selectedAnnotation) {
      setSelectedAnnotation(null);
    }
  };

  // Handle clicking an annotation: jump the video and show its details
  const handleAnnotationClick = (index) => {
    const ann = annotations[index];
    if (videoRef.current) {
      videoRef.current.currentTime = ann.timestamp;
      videoRef.current.pause(); // Keep the main video paused
    }
    setSelectedAnnotation(ann);
  };

  return (
    <div className="video-annotation-container">
      <h2>Interactive Video Annotation Tool</h2>
      
      {/* Video Import */}
      <div className="video-import">
        <input type="file" accept="video/*" onChange={handleVideoImport} />
      </div>
      
      {/* Media Section */}
      <div className="media-section">
        {selectedAnnotation && selectedAnnotation.media ? (
          <div className="combined-media">
            <div className="video-container">
              {videoSrc ? (
                <video ref={videoRef} controls width="300">
                  <source src={videoSrc} type="video/mp4" />
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <p>No video selected.</p>
              )}
            </div>
            <div className="comparison-media">
              <img src={selectedAnnotation.media} alt="Comparison" className="detail-image" />
            </div>
          </div>
        ) : (
          <div className="video-container">
            {videoSrc ? (
              <video ref={videoRef} controls width="600">
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <p>No video selected. Please import a video to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* Annotation Notes (always shown when an annotation is selected) */}
      {selectedAnnotation && (
        <div className="annotation-notes">
          <h3 className="detail-header">Annotation Details</h3>
          <p className="detail-text"><strong>Time:</strong> {selectedAnnotation.timestamp.toFixed(2)}s</p>
          <p className="detail-text"><strong>Note:</strong> {selectedAnnotation.note}</p>
        </div>
      )}

      {/* Annotation Controls */}
      <div className="annotation-controls">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Enter your annotation..."
        ></textarea>
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        <button onClick={handleAddAnnotation}>Add Annotation</button>
      </div>

      {/* Annotation List */}
      <div className="annotation-list">
        <h3>Annotations:</h3>
        {annotations.length === 0 ? (
          <p>No annotations added yet.</p>
        ) : (
          <ul>
            {annotations.map((ann, index) => (
              <li key={index}>
                <span
                  onClick={() => handleAnnotationClick(index)}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                >
                  <strong>{ann.timestamp.toFixed(2)}s</strong>
                </span> – 
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <button onClick={() => handleSaveEdit(index)}>Save</button>
                    <button onClick={() => setEditingIndex(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    {ann.note}{' '}
                    <button onClick={() => handleEditAnnotation(index)}>Edit</button>
                    <button onClick={() => handleDeleteAnnotation(index)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

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
        .video-import {
          text-align: center;
          margin-bottom: 10px;
        }
        /* Media Section */
        .media-section {
          margin-bottom: 20px;
        }
        .combined-media {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          padding-bottom: 10px;
        }
        .video-container {
          flex: 0 0 auto;
        }
        .comparison-media {
          flex: 0 0 auto;
          width: 300px;
        }
        .detail-image {
          width: 100%;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .annotation-notes {
          text-align: center;
          padding: 10px;
          margin-bottom: 20px;
        }
        .detail-header {
          font-size: 1.2rem;
          margin-bottom: 5px;
        }
        .detail-text {
          font-size: 0.9rem;
          margin: 3px 0;
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
          padding: 10px;
          border-bottom: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
      `}</style>
    </div>
  );
}
