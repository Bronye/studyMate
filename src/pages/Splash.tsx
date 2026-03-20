import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Splash() {
    const navigate = useNavigate();
    const { markSplashSeen } = useAppStore();

    const handleGetStarted = () => {
        markSplashSeen();
        navigate('/signup');
    };

    const handleSignIn = () => {
        markSplashSeen();
        navigate('/login');
    };

    const handleGuestTest = async () => {
        const { createGuestUser } = useAppStore.getState();
        await createGuestUser();
        navigate('/home');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--theme-background)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                    <BookOpen className="w-10 h-10" style={{ color: '#FFFFFF' }} />
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
                    Welcome to StudyMate
                </h1>

                {/* Subtitle */}
                <p className="text-xl mb-8 max-w-md mx-auto" style={{ color: 'var(--theme-text-secondary)' }}>
                    Your personal study companion for academic success
                </p>

                {/* Buttons */}
                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGetStarted}
                        className="w-full max-w-md px-6 py-4 rounded-xl font-semibold"
                        style={{
                            backgroundColor: 'var(--theme-primary)',
                            color: '#FFFFFF'
                        }}
                    >
                        Get Started
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSignIn}
                        className="w-full max-w-md px-6 py-4 rounded-xl font-semibold"
                        style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: '#000000'
                        }}
                    >
                        Sign In
                    </motion.button>

                    {/* Guest Quick Test */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGuestTest}
                        className="w-full max-w-md px-6 py-3 rounded-xl text-sm font-medium"
                        style={{
                            backgroundColor: 'transparent',
                            border: '2px solid var(--theme-text-secondary)',
                            color: 'var(--theme-text-secondary)'
                        }}
                    >
                        Guest Quick Test
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
