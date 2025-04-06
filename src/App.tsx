import './App.css';
import Fabricjs from './components/Fabricjs';
import { GestureDemo } from './components/GestureDemo';
import { useState } from 'react';

function App() {
  const [showGestureDemo, setShowGestureDemo] = useState(false);

  return (
    <div className="container mx-auto p-4 max-h-svh">
      <div className="flex justify-center space-x-4 mb-4">
        {/* <button
          type="button"
          className={`px-4 py-2 rounded ${!showGestureDemo ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowGestureDemo(false)}
        >
          Drawing Demo
        </button> */}
        {/* <button
          type="button"
          className={`px-4 py-2 rounded ${showGestureDemo ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setShowGestureDemo(true)}
        >
          Gesture Demo
        </button> */}
      </div>

      {showGestureDemo ? <GestureDemo /> : <Fabricjs />}
    </div>
  );
}

export default App;
