'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  
  const handleContinue = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <Image
          src="/logo/logo.jpeg"
          alt="Mechasense Logo"
          width={400}
          height={150}
          className="rounded-2xl shadow-lg object-contain"
          priority
        />
      </div>
      
      {/* Welcome Text */}
      <div className="text-center mb-8 animate-fade-in-delay">
        <h2 className="text-5xl md:text-6xl font-bold text-primary mb-2">
          Smart Motor Monitoring System
        </h2>
      </div>
      
      {/* Quote */}
      <div className="max-w-2xl text-center mb-12 animate-fade-in-delay-2">
        <blockquote className="text-lg md:text-xl text-gray-600 italic leading-relaxed">
          &ldquo;Predictive maintenance is not about fixing what’s broken, but preventing damage before it happens.&rdquo;
        </blockquote>
        <p className="text-sm text-gray-500 mt-3">
          — AI-Powered Monitoring
        </p>
      </div>
      
      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="group px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 animate-fade-in-delay-3"
      >
        <span>Continue to Dashboard</span>
        <svg 
          className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
      
      {/* Footer */}
      <p className="absolute bottom-6 text-sm text-gray-400">
        © 2024 Mechasense. Predictive Maintenance for Electric Motors.
      </p>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeIn 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-3 {
          animation: fadeIn 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
