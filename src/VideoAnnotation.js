'use client';
import React, { useRef, useState } from 'react';

export default function VideoAnnotationMVP() {
  const videoRef = useRef(null);
  const [annotations, setAnnotations] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [comparisonMedia, setComparisonMedia] = useState(null);

  const handleAddAnnotation = () => {
    if (videoRef.current) {
      const timestamp = videoRef.current.currentTime;
      const newAnnotation = { timestamp, note: currentNote, media: comparisonMedia };
      setAnnotations([...annotations, newAnnotation]);
      setCurrentNote("");
      setComparisonMedia(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setComparisonMedia(url);
    }
  };

  return (
    <div className="video-annotation-container">
      <video ref={videoRef} controls width="600">
        <source src="/path/to/slow-motion-video.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      <div className="annotation-controls">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Enter your annotation..."
        ></textarea>
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        <button onClick={handleAddAnnotation}>Add Annotation</button>
      </div>

      <div className="annotation-list">
        <h3>Annotations:</h3>
        {annotations.length === 0 ? (
          <p>No annotations added yet.</p>
        ) : (
          <ul>
            {annotations.map((ann, index) => (
              <li key={index}>
                <strong>{ann.timestamp.toFixed(2)}s</strong> – {ann.note}
                {ann.media && (
                  <div className="comparison-media">
                    <img src={ann.media} alt={`Comparison ${index}`} width="200" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .video-annotation-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        video {
          width: 100%;
          max-width: 600px;
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
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
        }
        .comparison-media {
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
