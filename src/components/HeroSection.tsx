'use client';

import Link from 'next/link';

export function HeroSection() {
  const stats = [
    { value: '$2.5M+', label: 'Total Endowment' },
    { value: '1,200+', label: 'Active Donors' },
    { value: '50+', label: 'Global Causes' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #2563eb, #9333ea, #4338ca)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 animate-fadeInUp">
            <span className="mr-2">🌟</span>
            Blockchain-Powered Perpetual Charity
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fadeInUp leading-tight" style={{ animationDelay: '100ms' }}>
            Sustainable Giving
            <br />
            <span 
              className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"
              style={{ 
                background: 'linear-gradient(to right, #fde047, #f9a8d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Through Waqf
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-12 animate-fadeInUp leading-relaxed" style={{ animationDelay: '200ms' }}>
            Create perpetual charity that keeps giving across generations.
            Secure, transparent, and impactful.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Free
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30"
            >
              <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How It Works
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fadeInUp" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#F9FAFB" />
        </svg>
      </div>
    </section>
  );
}
