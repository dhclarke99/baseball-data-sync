import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VideoAnnotation from './VideoAnnotation'; // Coach view component
import ClientView from './ClientView'; // Client view component
import Draw from './Draw'; // Import your Draw component

export default function App() {
  const [isCoach, setIsCoach] = useState(true);
  const [clientVideo, setClientVideo] = useState(null);
  const [annotations, setAnnotations] = useState([]);

  return (
   
      <Routes>
        <Route
          path="/"
          element={
            <div>
              {/* Fixed header container */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  zIndex: 1000,
                  borderBottom: '1px solid #ccc',
                }}
              >
                <div style={{ textAlign: 'center', padding: '1px 0' }}>
                  <button onClick={() => setIsCoach(true)}>Coach View</button>
                  <button onClick={() => setIsCoach(false)}>Client View</button>
                </div>
                {!isCoach && (
                  <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '40px', cursor: 'pointer' }}>
                      &lt;
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>Drill 3</span>
                  </div>
                )}
              </div>

              {/* Rest of content with top margin to clear the fixed header */}
              <div style={{ marginTop: '120px' }}>
                {isCoach ? (
                  <VideoAnnotation
                    clientVideo={clientVideo}
                    annotations={annotations}
                    setAnnotations={setAnnotations}
                  />
                ) : (
                  <ClientView
                    clientVideo={clientVideo}
                    setClientVideo={setClientVideo}
                    annotations={annotations}
                  />
                )}
              </div>
            </div>
          }
        />
        <Route path="/draw" element={<Draw clientVideo={clientVideo} />} />
      </Routes>

  );
}
