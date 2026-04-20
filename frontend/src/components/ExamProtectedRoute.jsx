import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * This component protects Exam Mode routes.
 * It checks for the 'accessToken' in localStorage.
 * If the token exists, it renders the content (children).
 * If not, it redirects the user to the Exam Login page.
 */
const ExamProtectedRoute = ({ children }) => {
    // Check for the token in LocalStorage
    const token = localStorage.getItem('accessToken');

    // If token exists, render the actual component (children)
    // If no token, redirect to /exam-login and replace the history entry
    if (token) {
        return children;
    } else {
        return <Navigate to="/exam-login" replace />;
    }
};

export default ExamProtectedRoute;