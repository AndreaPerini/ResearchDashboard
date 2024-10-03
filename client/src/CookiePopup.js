import React, { useState, useEffect } from 'react';

const CookiePopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div style={popupStyles}>
            <p>
                We use cookies to ensure you get the best experience on our website. By continuing to use our site, you accept our use of cookies. Read our {' '}
                <a href="https://rdm.unimi.it/privacy-policy" style={{ color: '#fff', textDecoration: 'underline' }}>
                    Privacy Policy
                </a>
                .
            </p>
            <button onClick={handleAccept} style={buttonStyles}>Accept</button>
        </div>
    );
};

// Stili inline per il popup
const popupStyles = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
    zIndex: 1000,
};

const buttonStyles = {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    marginLeft: '10px'
};

export default CookiePopup;
