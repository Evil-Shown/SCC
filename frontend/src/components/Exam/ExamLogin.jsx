import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

//User Auth for log in to Exammode

const ExamLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // ඔබගේ දැනට පවතින Backend Login API එකට Request එක යැවීම
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                // Exam Mode එකට අදාළව Token එක වෙනම තබාගැනීම හෝ සාමාන්‍ය Token එකම යාවත්කාලීන කිරීම
                sessionStorage.setItem('accessToken', response.data.data.accessToken);
                sessionStorage.setItem('refreshToken', response.data.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));

                // සාර්ථකව ලොග් වූ පසු Exam Mode Main Page එකට Redirect කිරීම
                // (ඔබගේ route එක අනුව මෙම path එක වෙනස් කරගන්න)
                navigate('/exam-mode'); 
            }
        } catch (err) {
            // Backend එකෙන් එවන Error message එක පෙන්වීම
            setError(
                err.response?.data?.message || 
                'ලොග් වීමේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-blue-700">Exam Mode</h2>
                    <p className="text-gray-500 mt-2 text-sm">Please login with your Email to continue</p>
                </div>
                
                {error && (
                    <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-5">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="student@example.com"
                            required
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 text-white font-bold rounded-lg ${
                            loading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        } transition-all duration-200`}
                    >
                        {loading ? 'Authenticating...' : 'Enter Exam Mode'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExamLogin;