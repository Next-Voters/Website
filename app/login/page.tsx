'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-page flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-[36px] font-bold text-gray-900 mb-2 font-plus-jakarta-sans leading-tight tracking-tight">
          {mode === 'signin' ? 'Welcome back.' : 'Create an account.'}
        </h1>
        <p className="text-[15px] text-gray-500 font-plus-jakarta-sans mb-8">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                className="text-[#E12D39] font-semibold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                className="text-[#E12D39] font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 font-plus-jakarta-sans text-[15px] focus:outline-none focus:border-gray-900 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 font-plus-jakarta-sans text-[15px] focus:outline-none focus:border-gray-900 transition-colors"
          />

          {error && (
            <p className="text-[#E12D39] text-[14px] font-plus-jakarta-sans">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-[14px] font-plus-jakarta-sans">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 text-[16px] font-bold text-white bg-[#E12D39] rounded-lg hover:bg-[#c92631] transition-colors font-plus-jakarta-sans disabled:opacity-60"
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
