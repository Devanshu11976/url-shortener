import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link2, Sparkles, Settings2 } from 'lucide-react';

interface URLShortenerFormProps {
  onShorten: (url: string, customAlias?: string, deleteAfterMinutes?: number) => Promise<void>;
}

export function URLShortenerForm({ onShorten }: URLShortenerFormProps) {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [deleteAfterMinutes, setDeleteAfterMinutes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baseUrlLabel = typeof window !== "undefined" ? `${window.location.origin}/` : "your-domain/";

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    if (customAlias && !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
      setError('Alias can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (deleteAfterMinutes.trim()) {
      const minutes = Number(deleteAfterMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        setError('Delete timer must be a positive number of minutes');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onShorten(
        url,
        customAlias || undefined,
        deleteAfterMinutes.trim() ? Number(deleteAfterMinutes) : undefined
      );
      setUrl('');
      setCustomAlias('');
      setDeleteAfterMinutes('');
      setShowAdvanced(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to shorten URL';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 md:p-10 relative overflow-hidden"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            animate={{ rotate: url ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link2 className="size-5" />
          </motion.div>
          <Input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="Enter your long URL here..."
            className="pl-12 pr-4 py-6 text-base rounded-xl bg-gray-900/50 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50 transition-all"
          />
        </motion.div>

        {/* Advanced Options Toggle */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Settings2 className="size-4 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </motion.div>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <motion.div
                className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10"
                initial={{ y: -10 }}
                animate={{ y: 0 }}
              >
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Custom Alias (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Base URL: <span className="font-medium">{baseUrlLabel}</span>
                  </p>
                  <div className="relative">
                    <Input
                      type="text"
                      value={customAlias}
                      onChange={(e) => {
                        setCustomAlias(e.target.value);
                        setError('');
                      }}
                      placeholder="my-custom-link"
                      className="pr-4 py-3 text-base rounded-lg bg-gray-900/50 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Create a memorable custom alias for your short URL
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Auto-delete timer in minutes (Optional)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={deleteAfterMinutes}
                    onChange={(e) => {
                      setDeleteAfterMinutes(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. 60"
                    className="pr-4 py-3 text-base rounded-lg bg-gray-900/50 border-white/20 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Link and its clicks will be deleted after this timer.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="text-sm text-red-400 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg
              className="size-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-base rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/30 relative overflow-hidden group"
          >
            {/* Button shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            <span className="relative z-10 flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="size-5 mr-2" />
                  </motion.div>
                  Shortening...
                </>
              ) : (
                <>
                  <Sparkles className="size-5 mr-2" />
                  Shorten URL
                </>
              )}
            </span>
          </Button>
        </motion.div>
      </form>

      <motion.div
        className="mt-6 flex items-center gap-4 text-sm text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { text: 'No signup required' },
          { text: 'Free forever' },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05, color: '#a78bfa' }}
          >
            <motion.svg
              className="size-4 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </motion.svg>
            <span>{item.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}