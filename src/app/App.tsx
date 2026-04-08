import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { URLShortenerForm } from './components/URLShortenerForm';
import { ShortenedURLCard } from './components/ShortenedURLCard';
import { URLHistoryList } from './components/URLHistoryList';
import { Link2, Zap, BarChart3, Shield } from 'lucide-react';

export interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customAlias?: string;
  createdAt: Date;
  expiresAt?: Date | null;
  clicks: number;
  clicksByDate: { date: string; clicks: number }[];
}

export default function App() {
  const [urls, setUrls] = useState<ShortenedURL[]>([]);
  const [currentUrl, setCurrentUrl] = useState<ShortenedURL | null>(null);

  const buildClicksByDate = (totalClicks: number) =>
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        clicks: index === 6 ? totalClicks : 0,
      };
    });

  const parseServerDate = (value?: string | null) => {
    if (!value) return null;
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    const normalized = hasTimezone ? value : `${value.replace(" ", "T")}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleShorten = async (longUrl: string, customAlias?: string, deleteAfterMinutes?: number) => {
    const shortenRes = await fetch("/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: longUrl, customAlias, deleteAfterMinutes }),
    });
    const shortenPayload = await shortenRes.json().catch(() => ({}));
    if (!shortenRes.ok) {
      throw new Error(shortenPayload?.error || "Failed to shorten URL.");
    }

    const statsRes = await fetch(`/stats/${encodeURIComponent(shortenPayload.code)}`);
    const statsPayload = await statsRes.json().catch(() => ({}));
    if (!statsRes.ok) {
      throw new Error(statsPayload?.error || "Failed to load URL stats.");
    }

    const totalClicks = Number(statsPayload.clickCount || 0);
    const clicksByDate = buildClicksByDate(totalClicks);

    const newUrl: ShortenedURL = {
      id: String(shortenPayload.code),
      originalUrl: String(shortenPayload.longUrl || longUrl),
      shortUrl: String(shortenPayload.shortUrl),
      shortCode: String(shortenPayload.code),
      customAlias,
      createdAt: parseServerDate(statsPayload.createdAt) || new Date(),
      expiresAt: parseServerDate(statsPayload.expiresAt),
      clicks: totalClicks,
      clicksByDate,
    };

    setCurrentUrl(newUrl);
    setUrls(prev => [newUrl, ...prev]);
  };

  useEffect(() => {
    if (urls.length === 0) {
      return;
    }

    const refreshStats = async () => {
      try {
        const results = await Promise.all(
          urls.map(async (url) => {
            const statsRes = await fetch(`/stats/${encodeURIComponent(url.shortCode)}`);
            if (!statsRes.ok) {
              if (statsRes.status === 404) {
                return { shortCode: url.shortCode, deleted: true as const };
              }
              return null;
            }
            const statsPayload = await statsRes.json();
            return {
              shortCode: url.shortCode,
              clickCount: Number(statsPayload.clickCount || 0),
              expiresAt: parseServerDate(statsPayload.expiresAt),
              createdAt: parseServerDate(statsPayload.createdAt),
            };
          })
        );

        const deletedCodes = new Set(
          results
            .filter((item): item is { shortCode: string; deleted: true } => item !== null && "deleted" in item)
            .map((item) => item.shortCode)
        );

        if (deletedCodes.size > 0) {
          setUrls((prev) =>
            prev.map((url) => {
              if (!deletedCodes.has(url.shortCode)) return url;
              return {
                ...url,
                expiresAt: url.expiresAt ?? new Date(),
              };
            })
          );

          setCurrentUrl((prev) => {
            if (!prev || !deletedCodes.has(prev.shortCode)) return prev;
            return {
              ...prev,
              expiresAt: prev.expiresAt ?? new Date(),
            };
          });
        }

        const statsMap = new Map(
          results
            .filter(
              (item): item is { shortCode: string; clickCount: number; expiresAt: Date | null; createdAt: Date | null } =>
                item !== null && !("deleted" in item)
            )
            .map((item) => [item.shortCode, item])
        );

        if (statsMap.size === 0) return;

        setUrls((prev) =>
          prev.map((url) => {
            const latest = statsMap.get(url.shortCode);
            if (!latest) {
              return url;
            }

            const nextClicks = latest.clickCount;
            const nextExpiresAt = latest.expiresAt ?? url.expiresAt ?? null;
            const nextCreatedAt = latest.createdAt ?? url.createdAt;

            const unchanged =
              nextClicks === url.clicks &&
              (nextExpiresAt?.getTime() ?? 0) === (url.expiresAt?.getTime() ?? 0) &&
              nextCreatedAt.getTime() === url.createdAt.getTime();

            if (unchanged) return url;

            return {
              ...url,
              createdAt: nextCreatedAt,
              expiresAt: nextExpiresAt,
              clicks: nextClicks,
              clicksByDate: buildClicksByDate(nextClicks),
            };
          })
        );

        setCurrentUrl((prev) => {
          if (!prev) return prev;
          const latest = statsMap.get(prev.shortCode);
          if (!latest) {
            return prev;
          }

          const nextClicks = latest.clickCount;
          const nextExpiresAt = latest.expiresAt ?? prev.expiresAt ?? null;
          const nextCreatedAt = latest.createdAt ?? prev.createdAt;
          const unchanged =
            nextClicks === prev.clicks &&
            (nextExpiresAt?.getTime() ?? 0) === (prev.expiresAt?.getTime() ?? 0) &&
            nextCreatedAt.getTime() === prev.createdAt.getTime();

          if (unchanged) return prev;

          return {
            ...prev,
            createdAt: nextCreatedAt,
            expiresAt: nextExpiresAt,
            clicks: nextClicks,
            clicksByDate: buildClicksByDate(nextClicks),
          };
        });
      } catch (_) {
        // Ignore transient polling failures; next poll will retry.
      }
    };

    const intervalId = window.setInterval(refreshStats, 5000);
    return () => window.clearInterval(intervalId);
  }, [urls]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="border-b border-white/10 bg-black/20 backdrop-blur-xl relative"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl relative"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Link2 className="size-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                URL Shortener
              </h1>
              <p className="text-sm text-gray-400">Shorten your links in seconds</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Make Your Links
            <motion.span
              className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Short & Sweet
            </motion.span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform long, unwieldy URLs into short, memorable links that are easy to share
          </p>
        </motion.div>

        {/* URL Shortener Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <URLShortenerForm onShorten={handleShorten} />
        </motion.div>

        {/* Current Shortened URL Result */}
        {currentUrl && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <ShortenedURLCard url={currentUrl} />
          </motion.div>
        )}

        {/* URL History */}
        {urls.length > 0 && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <URLHistoryList urls={urls} />
          </motion.div>
        )}

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Generate short links instantly with our optimized algorithm',
              gradient: 'from-yellow-500 to-orange-500',
              delay: 0.8,
            },
            {
              icon: BarChart3,
              title: 'Track Clicks',
              description: 'Monitor how many times your shortened links are clicked',
              gradient: 'from-purple-500 to-pink-500',
              delay: 1.0,
            },
            {
              icon: Shield,
              title: 'Secure & Reliable',
              description: 'Your links are safe and accessible 24/7 with 99.9% uptime',
              gradient: 'from-green-500 to-emerald-500',
              delay: 1.2,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -10 }}
            >
              <motion.div
                className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <feature.icon className="size-7 text-white" />
              </motion.div>
              <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        <div className="container mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <p>© 2026 URL Shortener. Built with modern web technologies.</p>
        </div>
      </motion.footer>
    </div>
  );
}