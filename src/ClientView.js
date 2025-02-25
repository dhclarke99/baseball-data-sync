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
  const hardcodedVideoRef = useRef(null);
  const [hardcodedIsPlaying, setHardcodedIsPlaying] = useState(false);
  const [clientIsPlaying, setClientIsPlaying] = useState(false);

  const toggleClientPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setClientIsPlaying(true);
    } else {
      videoRef.current.pause();
      setClientIsPlaying(false);
    }
  };

  const toggleClientSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };


  const toggleHardcodedPlay = () => {
    if (!hardcodedVideoRef.current) return;
    const vid = hardcodedVideoRef.current;
    if (vid.paused) {
      vid.play();
      setHardcodedIsPlaying(true);
    } else {
      vid.pause();
      setHardcodedIsPlaying(false);
    }
  };


  const toggleHardcodedSound = () => {
    if (!hardcodedVideoRef.current) return;
    const vid = hardcodedVideoRef.current;
    vid.muted = !vid.muted;
  };

  const toggleHardcodedFullScreen = () => {
    if (!hardcodedVideoRef.current) return;
    const vid = hardcodedVideoRef.current;
    if (vid.webkitEnterFullscreen) {
      vid.webkitEnterFullscreen();
    } else if (!document.fullscreenElement) {
      if (vid.requestFullscreen) {
        vid.requestFullscreen();
      } else if (vid.webkitRequestFullscreen) {
        vid.webkitRequestFullscreen();
      } else if (vid.mozRequestFullScreen) {
        vid.mozRequestFullScreen();
      } else if (vid.msRequestFullscreen) {
        vid.msRequestFullscreen();
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
    <div className="whole-container">
      <div className="drill-info">
        <div className="hardcoded-video-container" onClick={toggleHardcodedFullScreen}>
          <video
            ref={hardcodedVideoRef}
            className="client-video"
            controls={false}  // remove native controls
            muted
            playsInline
            poster="./Images/preview2.png"
          >
            <source src="./Videos/MIKE_45DEGREESTEP.MOV" type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
          <div className="video-overlay">
            <button
              className="play-button"
              onClick={(e) => { e.stopPropagation(); toggleHardcodedPlay(); }}
            >
              {hardcodedIsPlaying ? "I I" : "▶"}
            </button>

            <button
              className="sound-button"
              onClick={(e) => { e.stopPropagation(); toggleHardcodedSound(); }}
            >
              🔊
            </button>
          </div>
        </div>


        <div className="drill-details">
          <ul>
            <li>Drill Name: <b>45 Degree Drill</b></li>
            <li>Reps: <b>5</b></li>
            <li>Details: <b>Focus on staying closed</b></li>
          </ul>
        </div>
      </div>
      <div className="client-view-container">
        {/* New Fixed Header & Drill Info Section */}



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
              <div className="video-container" style={{ position: 'relative' }}>
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
                  onPlay={() => { setIsPlaying(true); setHasPlayed(true); setClientIsPlaying(true); }}
                  onPause={() => { setIsPlaying(false); setClientIsPlaying(false); }}
                  onClick={toggleFullScreen}
                >
                  <source src={clientVideo} type="video/mp4" />
                  Your browser does not support HTML5 video.
                </video>
                <div className="video-overlay">
                  <button
                    className="play-button"
                    onClick={(e) => { e.stopPropagation(); toggleClientPlay(); }}
                  >
                    {clientIsPlaying ? "I I" : "▶"}
                  </button>
                  <button
                    className="sound-button"
                    onClick={(e) => { e.stopPropagation(); toggleClientSound(); }}
                  >
                    🔊
                  </button>
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
                <strong>{selectedAnnotation.title}</strong>
                <p> {selectedAnnotation.note}</p>
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
            <div className="message-coach">
              <button>
                Message Coach
              </button>
            </div>

            {/* Hidden canvas for capturing a poster image */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </>

        )}
      </div>

      <style jsx>{`
      
.back-icon {
  font-size: 1.5rem;
  margin-right: 10px;
  cursor: pointer;
}
.drill-title {
  font-size: 1.5rem;
  font-weight: bold;
}
.drill-info {
  display: flex;
  flex-direction: column;
      align-items: flex-start;
  gap: 20px;
  padding: 20px 20px 0px 20px;
}
.hardcoded-video-container {
  position: relative;
  display: inline-block;
  margin-top: 40px;
}

.video-overlay {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none; /* Container click passes through */
}

.video-overlay button {
  pointer-events: all; /* Enable button clicks */
 background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  padding: 3px 12px 3px 12px;
  border-radius: 50%;
  cursor: pointer;
}

.drill-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.drill-details li {
  font-size: 0.9rem;
  margin-bottom: 10px;
}
.drill-details li b {
  font-weight: bold;
}

        .client-view-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0px 25px;
          font-family: Arial, sans-serif;
       
    //       display: flex;
    // flex-direction: column;
    // align-items: flex-start;
        }
        h2 {
          text-align: left;
          font-size: 1.2rem;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid rgb(214, 226, 231);
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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-timestamp {
  display: block;
  width: 100%;
  text-align: center;
  margin-top: 10px;
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
          max-height: 50vh;
          width: auto;
          height: auto;
          margin: 0 auto;
          margin-left: 0px;
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
  background: rgb(38, 42, 46);
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.5);
  transition: box-shadow 0.2s ease;
}

.annotation-list li:active {
  box-shadow: none;
}

        .annotation-content {
          display: flex;
          flex-direction: column;
          color: white;
        }
        .attached-media {
          margin-top: 5px;
        }
          .message-coach {
          border: none;
    background: none;
  text-align: center;
  margin: 20px auto;
  width: fit-content;
  color: #1273EB;
  margin-bottom: 10px;
}
  .message-coach, button {
  background: none;
  font-size: 1.0rem
  }
      `}</style>
    </div>
  );
}
