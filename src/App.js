import React, { useState } from 'react';
import VideoAnnotation from './VideoAnnotation'; // Coach view component
import ClientView from './ClientView'; // Client view component (new)

export default function App() {
  const [isCoach, setIsCoach] = useState(true);

  return (
    <div>
      {/* Toggle Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setIsCoach(true)}>Coach View</button>
        <button onClick={() => setIsCoach(false)}>Client View</button>
      </div>
      
      {/* Render the appropriate view */}
      {isCoach ? <VideoAnnotation /> : <ClientView />}
    </div>
  );
}
