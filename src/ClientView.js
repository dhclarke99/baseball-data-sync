'use client';
import React, { useRef, useState } from 'react';

export default function ClientView({ clientVideo, setClientVideo, annotations }) {
  const videoRef = useRef(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const handleVideoSubmit = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setClientVideo(url);
    }
  };

  const handleAnnotationClick = (index) => {
    const ann = annotations[index];
    if (videoRef.current) {
      videoRef.current.currentTime = ann.timestamp;
      videoRef.current.play().then(() => {
        setTimeout(() => {
          videoRef.current.pause();
        }, 100); // adjust delay as needed
      });
    }
    setSelectedAnnotation(ann);
  };


  return (
    <div className="client-view-container">
      <h2>Client Video Submission & Review</h2>

      {/* Video Submission */}
      {!clientVideo && (
        <div className="video-submission">
          <input type="file" accept="video/*" onChange={handleVideoSubmit} />
          <p>Please submit a video.</p>
        </div>
      )}

      {/* Video Display */}
      {clientVideo && (
        <>
          <div className="video-container">
            <video
              ref={videoRef}
              playsInline
              webkit-playsinline="true"
              controls
              width="600"
            >
              <source src={clientVideo} type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>

            {selectedAnnotation && (
              <div className="media-detail">
                <div className="annotation-notes">
                  <p><strong>Note:</strong> {selectedAnnotation.note}</p>
                </div>
                {selectedAnnotation.media && (
                  <img src={selectedAnnotation.media} alt="Detailed attached media" style={{ width: '300px' }} />
                )}

              </div>
            )}
          </div>

          {/* Detailed view for selected annotation (if any) */}


          {/* Coach's Annotations (read-only) */}
          <div className="annotation-list">
            <h3>Coach's Annotations:</h3>
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
        .client-view-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        h2 {
          text-align: center;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }
        .video-submission {
          text-align: center;
          margin-bottom: 20px;
        }
        .video-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .media-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
        
          
        }
        .annotation-notes {
          text-align: center;
          margin-top: 10px;
        }
        .annotation-notes h3 {
          font-size: 1.2rem;
          margin-bottom: 5px;
        }
        .annotation-notes p {
          font-size: 0.9rem;
          margin: 3px 0;
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
        .attached-media {
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
