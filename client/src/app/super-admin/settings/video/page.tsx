'use client';

import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { usePlatform } from '../../../../providers/PlatformProvider';
import { Video, Save, RefreshCw, Eye, CheckCircle2, Play } from 'lucide-react';

function getEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    if (rawUrl.includes('embed/')) return rawUrl;
    if (rawUrl.includes('watch?v=')) {
      const id = rawUrl.split('watch?v=')[1]?.split('&')[0];
      return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
    }
    if (rawUrl.includes('youtu.be/')) {
      const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
    }
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

export default function VideoSettingsPage() {
  const { settings, refreshSettings } = usePlatform();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.youtube_url) {
      setYoutubeUrl(settings.youtube_url);
    }
  }, [settings]);

  const embedUrl = getEmbedUrl(youtubeUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube video URL');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/super-admin/settings', { youtube_url: youtubeUrl.trim() });
      if (res.data?.success) {
        toast.success('YouTube Video URL updated successfully!');
        await refreshSettings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update video URL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Hero Video & YouTube URL
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Submit your product demonstration video link. This video is embedded on the right-hand side of the Public Landing Page hero section (matching the BizPOS showcase style).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                YouTube Video Link <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 pl-10"
                  required
                />
                <Video size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Supports standard YouTube links (<code>https://www.youtube.com/watch?v=ID</code>) and short links (<code>https://youtu.be/ID</code>).
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Landing Page Display Location</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                As seen in the BizPOS layout (Image 3), this video is placed directly beside the hero headline with interactive playback, software tour title, and live feature tags.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save & Publish Video</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Video Player Preview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye size={14} />
              <span>Live Player Preview</span>
            </h3>
            {embedUrl && (
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                Embed Ready
              </span>
            )}
          </div>

          <div className="relative aspect-video w-full bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Hero YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Play size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Enter a valid YouTube URL to preview the player.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Resolved Embed URL:</strong> {embedUrl || 'None'}
          </div>
        </div>
      </div>
    </div>
  );
}
