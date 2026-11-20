import React, { useState, useEffect } from 'react';
import Students from './Todo/Students/Students';
import Admin from './Todo/Admin/Admin';
import './App.css';
function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  if (currentPath === '/admin' || currentPath === '/admin/') {
    return <Admin />;
  }
  return <Students />;
}
export default App;
