import React, { useState, useEffect } from 'react';
import happyWac from '../assets/HappyWac.svg';
import wacintosh from '../assets/Wacintosh.svg';
import floppyDisk from '../assets/Save.svg';

const Startup = () => {
    const [stage, setStage] = useState('happyWac');
    useEffect(() => {
        if (stage === 'floppyInserted') {
            setTimeout(() => {
                setStage('happyWac');
            }, 1000);
        }
    }, [stage]);

    const handleFloppyDiskClick = () => {
        setStage('floppyInserted');
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            {stage === 'init' && (
                <>
                    <img src={wacintosh} alt="Wacintosh" style={{ marginBottom: '20px' }} />
                    <img src={floppyDisk} alt="Insert floppy disk" onClick={handleFloppyDiskClick} style={{ cursor: 'pointer', width: '30px', marginLeft: '45px' }} />
                </>
            )}
            {stage === 'happyWac' && (
                <img src={happyWac} alt="Welcome" />
            )}
        </div>
    );
};

export default Startup;
