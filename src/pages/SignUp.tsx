import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function SignUp() {
    const navigate = useNavigate();
    const { signUp } = useAppStore();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!formData.acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setIsLoading(true);

        try {
            const success = await signUp(formData.username, formData.email, formData.password);

            if (success) {
                navigate('/onboarding');
            } else {
                setError('Failed to create account');
            }
        } catch (err) {
            setError('An error occurred');
            console.error('Sign up error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--theme-background)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: 'var(--theme-text-primary)' }}>
                    Create Account
                </h1>

                {error && (
                    <div className="mb-4 p-3 rounded-xl" style={{
                        backgroundColor: 'var(--theme-error-bg)',
                        color: 'var(--theme-error-text)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors"
                            style={{
                                backgroundColor: 'var(--theme-input-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-primary)'
                            }}
                            placeholder="Choose a username"
                            autoComplete="username"
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors"
                            style={{
                                backgroundColor: 'var(--theme-input-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-primary)'
                            }}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors pr-12"
                                style={{
                                    backgroundColor: 'var(--theme-input-bg)',
                                    borderColor: 'var(--theme-border)',
                                    color: 'var(--theme-text-primary)'
                                }}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                                style={{ color: 'var(--theme-text-secondary)' }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors"
                            style={{
                                backgroundColor: 'var(--theme-input-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-primary)'
                            }}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                            className="w-4 h-4 rounded"
                            style={{
                                backgroundColor: 'var(--theme-input-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-primary)'
                            }}
                            required
                        />
                        <label
                            htmlFor="acceptTerms"
                            className="ml-2 text-sm"
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            I accept the{' '}
                            <a href="#" className="text-blue-600 hover:underline" style={{ color: 'var(--theme-primary)' }}>
                                Terms and Conditions
                            </a>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-semibold"
                        style={{
                            backgroundColor: 'var(--theme-primary)',
                            color: '#FFFFFF'
                        }}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </motion.button>

                    {/* Sign In Link */}
                    <div className="flex justify-between items-center">
                        <Link to="/login" className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
