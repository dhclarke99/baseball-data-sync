'use client';
import React, { useRef, useState } from 'react';

export default function VideoAnnotation({ clientVideo, annotations, setAnnotations }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoContainerRef = useRef(null); // For scrolling to the main video
  const [currentNote, setCurrentNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [comparisonMedia, setComparisonMedia] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [editingMedia, setEditingMedia] = useState(null);
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
    if (videoRef.current && currentNote.trim() !== "" && noteTitle.trim() !== "") {
      const timestamp = videoRef.current.currentTime;
      const newAnnotation = { timestamp, title: noteTitle, note: currentNote, media: comparisonMedia };
      setAnnotations([...annotations, newAnnotation]);
      setNoteTitle("");
      setCurrentNote("");
      setComparisonMedia(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      window.alert("Missing fields");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setComparisonMedia(url);
    }
  };

  // For editing an existing annotation:
  const handleEditAnnotation = (index, e) => {
    e.stopPropagation();
    setEditingIndex(index);
    const ann = annotations[index];
    setEditingTitle(ann.title);
    setEditingNote(ann.note);
    setEditingMedia(ann.media);
  };

  const handleSaveEdit = (index, e) => {
    e.stopPropagation();
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index] = {
      ...updatedAnnotations[index],
      title: editingTitle,
      note: editingNote,
      media: editingMedia,
    };
    setAnnotations(updatedAnnotations);
    setEditingIndex(null);
    setEditingTitle("");
    setEditingNote("");
    setEditingMedia(null);
  };

  const handleDeleteAnnotation = (index, e) => {
    e.stopPropagation();
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
    if (selectedAnnotation && updatedAnnotations[index] === selectedAnnotation) {
      setSelectedAnnotation(null);
    }
  };

  // Update media during editing via a file input.
  const handleEditMediaChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setEditingMedia(url);
    }
  };

  const handleAnnotationClick = (index) => {
    const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
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
  

  // Sort annotations by timestamp ascending.
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="video-annotation-container">
      <h2>Drill 1</h2>
      <div className="new-annotation">
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
        ) : (
          <p style={{ textAlign: 'center' }}>No client submissions yet.</p>
        )}

        {clientVideo && (
          <div className="annotation-controls">
            <textarea
              className="title-input"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title your feedback..."
            ></textarea>
            <textarea
              className="feedback-input"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Enter your feedback..."
            ></textarea>
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" className="file-upload-label">
              📎
            </label>
            <button onClick={handleAddAnnotation}>Add Feedback</button>
          </div>
        )}
      </div>
      <div className="annotation-list">
        <h3>Feedback:</h3>
        {sortedAnnotations.length === 0 ? (
          <p>No feedback added yet.</p>
        ) : (
          <ul>
            {sortedAnnotations.map((ann, index) => (
              <li key={index} onClick={() => handleAnnotationClick(index)}>
                <div className="annotation-content">
                  <div className="annotation-header">
                  <strong>{ann.title}</strong>
                  <strong>{ann.timestamp.toFixed(2)}s</strong>
                  </div>
                 
                  <p>{ann.note}</p>
                  {ann.media && (
                    <div className="attached-media">
                      <img
                        src={ann.media}
                        alt="Attached media"
                        style={{ width: '80px', marginTop: '5px' }}
                      />
                    </div>
                  )}
                  <div className="annotation-actions">
                    {editingIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Edit title"
                        />
                        <textarea
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          placeholder="Edit feedback"
                        ></textarea>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleEditMediaChange}
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .video-annotation-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          font-family: Inter, sans-serif;
        background:  #ffffff;
          border: 1px solid #b4d0df;
     
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        h2 {
          text-align: center;
          font-size: 1.75rem;
          margin-bottom: 20px;
          color: #333;
        }
        .new-annotation {
        font-family: Inter, sans-serif;
          display: flex;
          flex-direction: row;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 20px;
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
          gap: 15px;
        }
        .video-controls button {       
          font-size: 1rem;
          border: none; 
          cursor: pointer;
          background: none;    
        }
        
        .video-controls input[type="range"] {
          width: 60%;
        }
        .annotation-controls {
        box-sizing: border-box;
  /* existing properties */
  display: flex;
  flex-direction: column;
  padding: 15px;

 
  border-radius: 8px;

  flex: 1;
        }
        .title-input {
          height: 5vh;
          padding: 10px;
        
          font-size: 1rem;
           border: none;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  resize: none;

          font-family: Inter, sans-serif;
        }
        .feedback-input {
          height: 5vh;
          font-family: Inter, sans-serif;
          padding: 10px;
          font-size: 1rem;
           border: none;
  border-bottom: 1px solid #ccc;
  resize: none;
margin-bottom: 5px;
       
        }
        input[type="file"] {
          font-size: 1rem;
          
        }
        .annotation-controls button {
          padding: 10px 20px;
          font-size: 1rem;
          background: #0070f3;
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.3s;
          align-self: flex-start;
          margin-top: 5px;
      
        }
        .annotation-controls button:hover {
          background: #005bb5;
        }
        .annotation-list {
        font-family: Inter, sans-serif;
          margin-top: 20px;
          
          padding: 15px;
    
      
        }
        .annotation-list h3 {
          margin-bottom: 15px;
          color: #333;
          font-size: 1.5rem;
        }
        .annotation-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .annotation-list li {
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 6px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .annotation-list li:hover {
          background: #f1f1f1;
        }
        .annotation-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .annotation-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }
        .annotation-actions {
          display: flex;
          gap: 8px;
      
        }
        .annotation-actions button {
          padding: 6px 12px;
          font-size: 0.9rem;
          background: #0070f3;
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .annotation-actions button:hover {
          background: #005bb5;
        }
        .attached-media {
          margin-top: 5px;
        }
        @media (max-width: 768px) {
          .new-annotation {
            flex-direction: column;
            gap: 15px;
          }
          .video-container,
          .annotation-controls {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
