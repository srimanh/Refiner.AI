// src/components/CodeDisplay.jsx
import React, { useEffect, useState } from 'react';
import { getCorrectedCode } from '../utils/codeCorrector';

const CodeDisplay = () => {
    const [correctedCode, setCorrectedCode] = useState('');

    const fetchCode = async () => {
        const result = await getCorrectedCode();
        setCorrectedCode(result);
    };

    useEffect(() => {
        fetchCode();
    }, []);

    return (
        <div>
            <h1>Corrected Code:</h1>
            <pre>{JSON.stringify(correctedCode, null, 2)}</pre> 
        </div>
    );
};

export default CodeDisplay;
