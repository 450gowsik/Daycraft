import React, { useEffect } from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, title, subtitle, onClose, icon = "✅" }) => {
    if (!isOpen) return null;

    return (
        <div className="success-modal-overlay">
            <div className="success-modal-content">
                <div className="success-icon-animation">{icon}</div>
                <h2 className="success-title">{title}</h2>
                <p className="success-subtitle">{subtitle}</p>
                <div className="success-loader">
                    <div className="success-loader-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
