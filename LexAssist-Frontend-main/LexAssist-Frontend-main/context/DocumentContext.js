// context/DocumentContext.js
"use client";
import { createContext, useState, useContext } from 'react';

const DocumentContext = createContext();

export function DocumentProvider({ children }) {
    // State now holds an object with text and filename
    const [documentContext, setDocumentContext] = useState(null);

    return (
        <DocumentContext.Provider value={{ documentContext, setDocumentContext }}>
            {children}
        </DocumentContext.Provider>
    );
}

export function useDocument() {
    return useContext(DocumentContext);
}