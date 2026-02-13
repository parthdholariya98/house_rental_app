import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function OAuth({ role }) {
    const navigate = useNavigate();
    const handleGoogleClick = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);

            const result = await signInWithPopup(auth, provider);

            const res = await axios.post('http://localhost:5000/api/auth/google', {
                name: result.user.displayName,
                email: result.user.email,
                photo: result.user.photoURL,
                role: role || 'user',
            });

            if (res.status === 200 || res.status === 201) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('userId', res.data._id);
                localStorage.setItem('userInfo', JSON.stringify(res.data));

                toast.success(`Welcome back! Logged in as ${res.data.role === 'owner' ? 'Owner' : 'User'}`);
                console.log("Auth Success. Role:", res.data.role);

                if (res.data.role === 'admin') {
                    console.log("Navigating to Admin Users");
                    navigate('/admin/users');
                } else if (res.data.role === 'owner' || res.data.role === 'broker') {
                    console.log("Navigating to Dashboard");
                    navigate('/dashboard');
                } else {
                    console.log("Navigating to Home (User)");
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('Google Auth Error:', error);
            const message = error.response?.data?.message || error.message || 'Google authentication failed';
            toast.error(message);
        }
    };

    return (
        <button
            onClick={handleGoogleClick}
            type='button'
            className='w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-300 transform active:scale-95 shadow-sm'
        >
            <img
                src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
                alt='google'
                className='w-5 h-5'
            />
            Continue with Google
        </button>
    );
}
