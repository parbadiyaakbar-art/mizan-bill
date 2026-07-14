import React, { FormEvent } from 'react';
import { useState } from 'react';
import { Building2, Lock, Mail, AlertCircle, KeyRound, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../services/AuthService';
import { User } from '../types';
import LegalViewer from '../components/LegalViewer';
import { checkRateLimit, logSecurityEvent } from '../services/SecurityService';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [showLegal, setShowLegal] = useState<'terms' | 'privacy' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  // Since we have fallbacks in firebase.ts, we can assume it's configured
  const isFirebaseConfigured = true;
  const missingVars: string[] = [];

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError(`Firebase is not fully configured. Missing: ${missingVars.join(', ')}`);
      return;
    }

    // Strict Field Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    if (isRegistering) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters for security.');
        return;
      }
      if (!agreedToLegal) {
        setError('You must read and agree to the Terms of Service and Privacy Policy to proceed.');
        return;
      }
    }

    if (!checkRateLimit(isRegistering ? 'AUTH_REGISTER' : 'AUTH_LOGIN')) {
      setError('Too many requests. Please wait a moment before trying again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Initiating authentication for:', email);
      let loggedUser: User;
      if (isRegistering) {
        loggedUser = await registerWithEmail(email, password);
      } else {
        // Strict verification: this MUST succeed before any redirection
        loggedUser = await loginWithEmail(email, password);
      }
      
      if (!loggedUser || !loggedUser.id) {
        throw new Error('Verification failed: User object was empty after authentication.');
      }

      console.log('Authentication successful for:', loggedUser.email);
      
      // Only proceed to onLogin if the above succeeded without throwing
      setIsLoading(false);
      onLogin(loggedUser);
    } catch (err: any) {
      console.error('Auth Error:', err);
      let errorMessage = 'Invalid Credentials'; // Default strict message
      
      const fireErrorCode = err.code || '';
      
      // Map specific Firebase errors to strict "Invalid Credentials" or helpful technical messages
      if (fireErrorCode.includes('auth/invalid-credential')) {
        errorMessage = 'Invalid Credentials';
      } else if (fireErrorCode.includes('auth/user-not-found')) {
        errorMessage = 'Invalid Credentials'; // Use same message for security (don't reveal user existence)
      } else if (fireErrorCode.includes('auth/wrong-password')) {
        errorMessage = 'Invalid Credentials';
      } else if (fireErrorCode.includes('auth/too-many-requests')) {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (fireErrorCode.includes('auth/network-request-failed')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (fireErrorCode.includes('auth/popup-closed-by-user')) {
        errorMessage = 'Sign-in popup was closed.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured.');
      return;
    }

    if (!checkRateLimit('AUTH_GOOGLE')) {
      setError('Too many requests. Please wait a moment.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const loggedUser = await loginWithGoogle();
      onLogin(loggedUser);
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Google Sign-In failed';
      if (errorMessage.includes('auth/popup-closed-by-user')) errorMessage = 'Sign-in popup was closed.';
      else if (errorMessage.includes('auth/operation-not-allowed')) errorMessage = 'Google Sign-In is not enabled in Firebase. Please enable it in the Firebase Console.';
      else if (errorMessage.startsWith('Firebase: ')) {
        errorMessage = errorMessage.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim();
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-8 text-zinc-100">
      <div className="w-full max-w-[1200px] h-[800px] max-h-[90vh] bg-zinc-900/40 backdrop-blur-xl border border-indigo-500/10 rounded-xl shadow-2xl flex overflow-hidden">
        {/* Left Side */}
        <div className="hidden lg:flex w-1/2 bg-zinc-900/50 flex-col justify-between p-12 relative border-r border-indigo-500/10">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <Building2 className="text-indigo-500 w-10 h-10" />
              <h1 className="text-3xl font-bold tracking-tight">Mizan Bill</h1>
            </div>
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-semibold border border-indigo-500/20">
                Beta Version
              </div>
              <h2 className="text-4xl font-bold leading-tight text-indigo-400">
                Enterprise Billing,<br />Simplified.
              </h2>
              <p className="text-lg text-zinc-400 max-w-md">
                Experience our next-generation GST compliance and financial reporting platform. 
                Free access is available during our exclusive beta period.
              </p>
            </div>
          </div>
          <div className="relative z-10 bg-zinc-950/40 border border-indigo-500/10 p-6 rounded-lg mt-auto">
            <h4 className="font-semibold text-indigo-400">Secure Enterprise Access</h4>
            <p className="text-sm text-zinc-400 mt-1">Advanced compliance tracking for complete peace of mind.</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 relative">
          {!isFirebaseConfigured && (
            <div className="absolute top-4 right-4 left-4 bg-orange-500/10 border border-orange-500/50 text-orange-400 p-4 rounded-xl flex gap-3 text-sm z-50">
              <KeyRound className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Action Required</p>
                <p className="mt-1">
                  Missing Vercel Environment Variables: <br/>
                  <span className="font-mono text-xs text-orange-300/80">{missingVars.join(', ')}</span>
                </p>
              </div>
            </div>
          )}
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <Building2 className="text-indigo-500 w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight text-indigo-400">Mizan Bill</h1>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-indigo-400">Welcome back</h2>
              <p className="mt-2 text-sm text-zinc-400">Please enter your details to sign in.</p>
            </div>

            <form className="space-y-6" onSubmit={handleAuth}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg flex items-center gap-3 text-sm text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="flex-1 break-words leading-relaxed">{error}</p>
                </div>
              )}

              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@enterprise.com"
                      className="block w-full pl-10 px-3 py-2 border border-zinc-700 bg-zinc-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 px-3 py-2 border border-zinc-700 bg-zinc-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-zinc-700 rounded bg-zinc-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                    {isRegistering ? 'Already have an account?' : 'Create an account'}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="flex items-start gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                  <div className="pt-0.5">
                    <input
                      id="legal-agreement"
                      type="checkbox"
                      checked={agreedToLegal}
                      onChange={(e) => setAgreedToLegal(e.target.checked)}
                      className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-zinc-700 rounded bg-zinc-900 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="legal-agreement" className="text-xs text-zinc-400 leading-relaxed cursor-pointer select-none">
                    I have read and agree to the{' '}
                    <button 
                      type="button" 
                      onClick={() => setShowLegal('terms')}
                      className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button 
                      type="button" 
                      onClick={() => setShowLegal('privacy')}
                      className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                    >
                      Privacy Policy
                    </button>.
                    <span className="block mt-1 text-zinc-500 italic">
                      Beta Phase: Regular manual data backups are mandatory.
                    </span>
                  </label>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !isFirebaseConfigured || (isRegistering && !agreedToLegal)}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : isRegistering ? 'Sign up' : 'Sign in'}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-900/40 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || !isFirebaseConfigured}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </form>
          </div>
        </div>
      </div>
      {showLegal && (
        <LegalViewer 
          type={showLegal} 
          onClose={() => setShowLegal(null)} 
        />
      )}
    </div>
  );
}
