import React, { useState } from 'react';

const App = () => {
    console.log('Simple App component rendering...');
    
    const [count, setCount] = useState(0);
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Simple React Test</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
};

export default App; 