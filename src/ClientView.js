'use client';
import React, { useRef, useState, useEffect } from 'react';

export default function ClientView({ clientVideo, setClientVideo, annotations }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // for capturing a poster image
  const videoContainerRef = useRef(null); // for scrolling into view
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [videoPoster, setVideoPoster] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadTimestamp, setUploadTimestamp] = useState(null);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: '2-digit' };
    const formattedDate = date.toLocaleDateString('en-US', optionsDate);
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime);
    return `${formattedDate} - ${formattedTime}`;
  };


  useEffect(() => {
    const storedTimestamp = localStorage.getItem('uploadTimestamp');
    if (storedTimestamp) {
      setUploadTimestamp(new Date(storedTimestamp));
    }
  }, []);

  const handleVideoSubmit = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setClientVideo(url);
      const now = new Date();
      setUploadTimestamp(now);
      localStorage.setItem('uploadTimestamp', now.toISOString());
    }
  };



  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/jpeg");
      setVideoPoster(dataURL);
    }
  };

  const handleLoadedData = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1;  // seek to 1 second
    }
  };
  
  const handleSeeked = () => {
    captureFrame();
    videoRef.current.pause();
  };
  


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

  const toggleFullScreen = () => {
    if (videoRef.current) {
      // For iOS Safari, use webkitEnterFullscreen if available.
      if (videoRef.current.webkitEnterFullscreen) {
        videoRef.current.webkitEnterFullscreen();
      } else if (!document.fullscreenElement) {
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
    }
  };


  const handleAnnotationClick = (index) => {
    const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
    const ann = sortedAnnotations[index];
    if (videoRef.current) {
      videoRef.current.currentTime = ann.timestamp;
      // Play briefly to update the frame, then pause.
      videoRef.current.play().then(() => {
        setTimeout(() => {
          videoRef.current.pause();
        }, 50);
      });
    }
    setSelectedAnnotation(ann);
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="client-view-container">
      <h2>Your Drills</h2>

      {/* Video Submission */}
      {!clientVideo && (
        <div className="video-submission">
          <img className="upload-video-logo" src="./Images/upload_drill_logo.jpg" alt="na" />
          <p>Upload your drill video here</p>
          {/* Hidden file input */}
          <input
            id="video-upload-input"
            type="file"
            accept="video/*"
            onChange={handleVideoSubmit}
            style={{ display: 'none' }}
          />
          <button
            className="upload-video-btn"
            onClick={() => document.getElementById('video-upload-input').click()}
          >
            Start Drill
          </button>
        </div>
      )}


      {/* Video Display */}
      {clientVideo && (
        <>
          <div className="video-media-container" ref={videoContainerRef}>
            <div className="video-container">
              <video
                ref={videoRef}
                controls={false}
                autoPlay
                preload="auto"
                playsInline
                webkit-playsinline="true"
                muted
                className="client-video"
                poster={videoPoster}
                onLoadedData={handleLoadedData}
                onSeeked={handleSeeked}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => { setIsPlaying(true); setHasPlayed(true); }}
                onPause={() => setIsPlaying(false)}
              >
                <source src={clientVideo} type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>

              {uploadTimestamp && (
                <div className="upload-timestamp">
                  {formatTimestamp(uploadTimestamp)}
                </div>
              )}
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
                  {isPlaying ? "⏸" : "▶"}
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
                <button onClick={toggleFullScreen}>⛶</button>
              </div>
            </div>
            {/* If an annotation is selected and has attached media, show it to the right */}
            {selectedAnnotation && selectedAnnotation.media && (
              <div className="annotation-media">
                <img
                  src={selectedAnnotation.media}
                  alt="Attached media"
                />
              </div>
            )}
          </div>

          {/* Annotation notes remain below the main video */}
          {selectedAnnotation && (
            <div className="annotation-notes">
              <p><strong>Note:</strong> {selectedAnnotation.note}</p>
            </div>
          )}

          {/* Annotations List */}
          <div className="annotation-list">
            <h3>Coach's Feedback:</h3>
            {sortedAnnotations.length === 0 ? (
              <p>No feedback yet.</p>
            ) : (
              <ul>
                {sortedAnnotations.map((ann, index) => (
                  <li key={index} onClick={() => handleAnnotationClick(index)}>
                    <div className="annotation-content">
                      <strong>{ann.title}</strong>

                    </div>
                    {ann.media && (
                      <div className="attached-media">
                        <img
                          src="./Images/camera_logo.png"
                          alt="Attached media"
                          style={{ width: '20px', marginTop: '5px' }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hidden canvas for capturing a poster image */}
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </>
      )}

      <style jsx>{`
        .client-view-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 25px;
          font-family: Arial, sans-serif;
    //       display: flex;
    // flex-direction: column;
    // align-items: flex-start;
        }
        h2 {
          text-align: left;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }
          .upload-video-logo {
          max-width: 20vw;

          }
          .video-submission p {
          font-size: 12px;
          color: grey;
          }
          .upload-video-btn {
          padding: 20px;
          width: 100%;
          background: #1273EB;
          color: white;
          border-radius: 20px;
          font-size: 16px;
          }
        .video-submission {
          text-align: center;
          margin-bottom: 20px;
        }
        .video-media-container {
          display: flex;
          justify-content: left;
          gap: 10px;
          overflow-x: auto;
          margin-bottom: 10px;
        }
          .video-container {
          
          margin-bottom: 20px;
        }
          .upload-timestamp {
  font-size: 0.8rem;
  color: #9e9898;
  text-align: center;
  margin: 5px 0;

}
          .video-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          
        }
        .video-controls button {       
          font-size: 1rem;
          border: none; 
          cursor: pointer;
          background: none;    
        }
        
        .video-controls input[type="range"] {
          width: 100%;
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
        .annotation-media {
  flex: 0 0 auto;
  max-width: 60vw;   /* slightly smaller width */
  max-height: 40vh;  /* increased height for a vertical rectangle */
  
}

.annotation-media img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border: 1px solid #ccc;
  border-radius: 4px;
}

        .annotation-notes {
          text-align: center;
          margin-bottom: 20px;
        }
        .annotation-notes p {
          font-size: 1rem;
        }
        .annotation-list {
          
        }
        .annotation-list ul {
          list-style: none;
          padding: 0;
        }
        .annotation-list li {
          padding: 10px;
    border: 1px solid #ccc;
    border-radius: 12px;
    margin-bottom: 5px;
    cursor: pointer;
    background: #1273EB;
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
    justify-content: space-between;
        }
        .annotation-content {
          display: flex;
          flex-direction: column;
          color: white;
        }
        .attached-media {
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
