'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Minimal 404 with geometric design */}
        <div className="mb-12">
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-[120px] sm:text-[140px] font-light text-gray-900 leading-none">4</span>
            <div className="flex flex-col">
              <div className="w-12 h-12 border-2 border-gray-900 mb-2"></div>
              <div className="w-8 h-8 border-2 border-gray-900"></div>
            </div>
            <span className="text-[120px] sm:text-[140px] font-light text-gray-900 leading-none">4</span>
          </div>
        </div>

        {/* Clean typography */}
        <div className="mb-10 space-y-3">
          <h1 className="text-2xl font-normal text-gray-900 tracking-tight">
            This page doesn&apos;t exist
          </h1>
          <p className="text-sm text-gray-500 font-light leading-relaxed max-w-md mx-auto">
            The link you followed may be broken, or the page may have been removed.
          </p>
        </div>

        {/* Minimal navigation */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-4 decoration-gray-400 hover:decoration-gray-600"
          >
            Dashboard
          </button>
        </div>

        {/* Subtle grid pattern background */}
        <div className="fixed inset-0 -z-10 opacity-[0.02] pointer-events-none">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
