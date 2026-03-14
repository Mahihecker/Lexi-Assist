// app/test/page.js
"use client";
import { useState } from 'react';
import axios from 'axios';

export default function TestPage() {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleTestRequest = async () => {
        setResponse(null);
        setError(null);

        // We get the URL directly from the environment variables
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        if (!apiUrl) {
            setError("ERROR: NEXT_PUBLIC_API_BASE_URL is not defined in your .env.local file!");
            return;
        }

        console.log(`Attempting to send GET request to: ${apiUrl}`);

        try {
            // Make a direct request to the root of the backend
            const result = await axios.get(apiUrl);
            console.log("Response received:", result);
            setResponse(JSON.stringify(result.data, null, 2));
        } catch (err) {
            console.error("Request failed:", err);
            setError(`Request Failed. Check the browser console (F12) for more details. Error: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Backend Connection Test</h1>
            <p>This page tests the basic connection to the FastAPI backend.</p>
            <button onClick={handleTestRequest} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
                Run Test
            </button>
            
            <div style={{ marginTop: '1.5rem' }}>
                <h2>Result:</h2>
                {response && (
                    <pre style={{ background: '#e0ffe0', padding: '1rem', border: '1px solid green' }}>
                        {response}
                    </pre>
                )}
                {error && (
                    <pre style={{ background: '#ffe0e0', padding: '1rem', border: '1px solid red' }}>
                        {error}
                    </pre>
                )}
            </div>
        </div>
    );
}