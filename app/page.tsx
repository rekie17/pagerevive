'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  const analyzeURL = async () => {
    if (!url) return;
    
    // Auto-add https:// if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      // Step 1: Get screenshots
      const screenshotRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!screenshotRes.ok) {
        const errData = await screenshotRes.json();
        throw new Error(errData.error || 'Failed to capture screenshots');
      }
      
      const { desktop, mobile } = await screenshotRes.json();

      // Step 2: Analyze with streaming
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, desktop, mobile }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const result = await analyzeRes.json();
      setAnalysis({ ...result, desktop, mobile });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              PageRevive
            </h1>
            <p className="text-xl text-slate-300">
              AI-powered page analysis & conversion optimization
            </p>
          </div>

          {/* Input Section */}
          {!analysis && (
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Enter any URL to analyze
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyzeURL()}
                  placeholder="example.com or https://example.com"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-slate-500"
                  disabled={loading}
                />
                <button
                  onClick={analyzeURL}
                  disabled={loading || !url}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                No need to include https:// — we'll add it for you
              </p>
              {error && (
                <p className="mt-3 text-red-400 text-sm">{error}</p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-amber-500"></div>
              <p className="mt-4 text-slate-400">Capturing screenshots & analyzing...</p>
            </div>
          )}

          {/* Results */}
          {analysis && !loading && (
            <div className="space-y-8">
              {/* Scores */}
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
                <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(analysis.scores || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        value >= 70 ? 'text-green-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {value}
                      </div>
                      <div className="text-sm text-slate-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Findings */}
              {analysis.audit && analysis.audit.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Key Findings</h3>
                  <ul className="space-y-2">
                    {analysis.audit.map((finding: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Screenshots */}
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Screenshots</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Desktop</p>
                    <img 
                      src={analysis.desktop} 
                      alt="Desktop screenshot" 
                      className="rounded-lg border border-slate-600 w-full"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Mobile</p>
                    <img 
                      src={analysis.mobile} 
                      alt="Mobile screenshot" 
                      className="rounded-lg border border-slate-600 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setAnalysis(null);
                  setUrl('');
                }}
                className="w-full px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Analyze Another Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
