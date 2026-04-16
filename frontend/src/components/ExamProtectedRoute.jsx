import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../utils/authStorage.js';

const ExamProtectedRoute = () => {
    const token = getAccessToken();

    // Token එක තිබේ නම් අදාළ Exam Component එක (Outlet) පෙන්වයි.
    // නැතිනම් නැවත '/exam-login' පිටුවට යවයි.
    return token ? <Outlet /> : <Navigate to="/exam-login" replace />;
};

export default ExamProtectedRoute;