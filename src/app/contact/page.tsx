'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function ContactPage() {
  // Always start with false on server to match SSR
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');






  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(result.message);
        setFormData({ email: '', message: '' }); // Reset form
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen transition-colors duration-200 bg-gradient-to-b from-white to-gray-50">
      {/* Main Content */}
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium mb-8 transition-colors hover:opacity-80"
              style={{color: '#6b7280'}}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-8" style={{color: '#1f2937'}}>
              Get in Touch
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: '#374151'}}>
              Have questions? Need help? We&apos;re here to support you every step of the way.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#f8f9fa'}}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg mb-6 ${
                false 
                  ? 'bg-gray-900/50 border border-gray-800' 
                  : 'bg-white border border-gray-200'
              }`}>
                <Mail className="w-8 h-8" style={{color: '#6b7280'}} />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4" style={{color: '#1f2937'}}>
                Email Support
              </h2>
              <p className="text-lg mb-6" style={{color: '#6b7280'}}>
                Get help via email - we respond within 24 hours
              </p>
              <a 
                href="mailto:support@invoiceflow.com" 
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: '#f8f9fa',
                  border: `1px solid ${'#d1d5db'}`,
                  color: '#3b82f6'
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                support@invoiceflow.com
              </a>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: '#1f2937'}}>
                Send us a Message
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{color: '#64748b'}}>
                Have a question or need help? We&apos;d love to hear from you.
              </p>
            </div>

            <div className={`p-8 rounded-lg border ${
              false 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Status Message */}
              {submitMessage && (
                <div className={`mb-6 p-4 rounded-lg ${
                  submitStatus === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="text-sm font-medium">{submitMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{color: '#1f2937'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      color: '#1f2937'
                    }}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2" style={{color: '#1f2937'}}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      color: '#1f2937'
                    }}
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-8 py-4 rounded-lg text-sm font-medium transition-colors ${
                      isSubmitting
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    } ${
                      false 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#f8f9fa'}}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: '#1f2937'}}>
                Frequently Asked Questions
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{color: '#64748b'}}>
                Quick answers to common questions
              </p>
            </div>

            <div className="space-y-6">
              <div className={`p-6 rounded-lg border ${
                false 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-lg font-bold mb-3" style={{color: '#1f2937'}}>
                  How quickly do you respond to support requests?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  We typically respond to all support requests within 24 hours. For urgent issues, please mention &quot;URGENT&quot; in your subject line.
                </p>
              </div>

              <div className={`p-6 rounded-lg border ${
                false 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-lg font-bold mb-3" style={{color: '#1f2937'}}>
                  Do you offer phone support?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Currently, we provide support via email and live chat. Phone support is available for enterprise customers.
                </p>
              </div>

              <div className={`p-6 rounded-lg border ${
                false 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-lg font-bold mb-3" style={{color: '#1f2937'}}>
                  Can I schedule a demo or consultation?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Absolutely! Please mention &quot;DEMO REQUEST&quot; in your message and we&apos;ll schedule a personalized demo for you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
