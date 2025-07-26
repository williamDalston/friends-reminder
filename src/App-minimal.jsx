import React, { useState } from 'react';

const App = () => {
    console.log('Minimal App component rendering...');
    
    const [count, setCount] = useState(0);
    const [isAuthReady, setIsAuthReady] = useState(true);
    const [user, setUser] = useState(null);
    
    // Simple collapsible section component
    const CollapsibleSection = ({ title, children, defaultExpanded = false }) => {
        const [expanded, setExpanded] = useState(defaultExpanded);
        
        return (
            <div style={{
                marginBottom: '24px',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        backgroundColor: '#f8f9fa',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#2c3e50'
                    }}
                >
                    {title}
                    <span style={{
                        fontSize: '20px',
                        transition: 'transform 0.2s ease',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                        ▼
                    </span>
                </button>
                {expanded && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#ffffff'
                    }}>
                        {children}
                    </div>
                )}
            </div>
        );
    };
    
    if (!isAuthReady) {
        return <div>Loading...</div>;
    }
    
    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Friends Reminder App</h1>
                <p>Please log in to continue</p>
                <button onClick={() => setUser({ uid: 'test-user' })}>
                    Test Login
                </button>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Friends Reminder App - Minimal Test</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
            
            <CollapsibleSection title="Test Section" defaultExpanded={true}>
                <p>This is a test collapsible section.</p>
                <p>If you can see this, the CollapsibleSection component is working!</p>
            </CollapsibleSection>
            
            <CollapsibleSection title="Another Test Section" defaultExpanded={false}>
                <p>This section starts collapsed.</p>
                <p>Click the header to expand it.</p>
            </CollapsibleSection>
        </div>
    );
};

export default App; 