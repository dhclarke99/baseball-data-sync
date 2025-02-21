import React, { useState } from 'react';
import VideoAnnotation from './VideoAnnotation'; // Coach view component
import ClientView from './ClientView'; // Client view component

export default function App() {
  const [isCoach, setIsCoach] = useState(true);
  const [clientVideo, setClientVideo] = useState(null);
  const [annotations, setAnnotations] = useState([]);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setIsCoach(true)}>Coach View</button>
        <button onClick={() => setIsCoach(false)}>Client View</button>
      </div>
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
  );
}
