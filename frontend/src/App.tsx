import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReferencePage from './pages/ReferencePage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/reference" element={<ReferencePage />} />
            </Routes>
        </Router>
    );
}

export default App; 