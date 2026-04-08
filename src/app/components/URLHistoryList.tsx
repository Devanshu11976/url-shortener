import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Copy, Check, ExternalLink, Clock, ChevronDown, ChevronUp, BarChart3, QrCode } from 'lucide-react';
import { ShortenedURL } from '../App';
import { QRCodeSVG } from 'qrcode.react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface URLHistoryListProps {
  urls: ShortenedURL[];
}

export function URLHistoryList({ urls }: URLHistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = async (shortUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(date);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="size-6 text-purple-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Recent Links</h2>
        <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          {urls.length} {urls.length === 1 ? 'link' : 'links'}
        </span>
      </motion.div>

      <div className="space-y-3">
        {urls.map((url, index) => (
          <motion.div
            key={url.id}
            className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all group"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Main Content */}
            <div className="p-5">
              {/* Hover gradient effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 1 }}
              />

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Shortened URL */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <motion.a
                      href={url.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 font-semibold hover:text-blue-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      {url.shortUrl}
                    </motion.a>
                      {url.customAlias && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md">
                        Custom Alias
                      </span>
                    )}
                      {url.expiresAt && url.expiresAt.getTime() <= Date.now() && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-md">
                          Expired
                        </span>
                      )}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => handleCopy(url.shortUrl, url.id)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 px-3 hover:bg-white/10"
                      >
                        <motion.div
                          animate={copiedId === url.id ? { rotate: [0, 15, -15, 0] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {copiedId === url.id ? (
                            <Check className="size-4 text-green-400" />
                          ) : (
                            <Copy className="size-4 text-gray-400" />
                          )}
                        </motion.div>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Original URL */}
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <ExternalLink className="size-4 flex-shrink-0 mt-0.5" />
                    <p className="truncate">{url.originalUrl}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <motion.span
                      className="flex items-center gap-1.5"
                      whileHover={{ scale: 1.05, color: '#a78bfa' }}
                    >
                      <BarChart3 className="size-4" />
                      {url.clicks} clicks
                    </motion.span>
                    <motion.span
                      className="flex items-center gap-1.5"
                      whileHover={{ scale: 1.05, color: '#a78bfa' }}
                    >
                      <Clock className="size-4" />
                      {formatDate(url.createdAt)}
                    </motion.span>
                  </div>
                </div>

                {/* Expand Button */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={() => toggleExpand(url.id)}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 hover:bg-white/10"
                  >
                    {expandedId === url.id ? (
                      <ChevronUp className="size-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="size-5 text-gray-400" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedId === url.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10"
                >
                  <div className="p-5 space-y-6">
                    {/* QR Code and Quick Actions */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* QR Code */}
                      <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center">
                        <div className="bg-white p-3 rounded-lg mb-3">
                          <QRCodeSVG
                            value={url.shortUrl}
                            size={120}
                            level="H"
                            includeMargin
                          />
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          QR Code
                        </p>
                      </div>

                      {/* Stats Cards */}
                      <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Total Clicks</p>
                          <p className="text-3xl font-bold text-white">{url.clicks}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <p
                            className={`text-xl font-bold ${
                              url.expiresAt && url.expiresAt.getTime() <= Date.now()
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {url.expiresAt && url.expiresAt.getTime() <= Date.now() ? "Expired" : "Live"}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Avg. Daily</p>
                          <p className="text-xl font-bold text-white">
                            {Math.round(url.clicks / 7)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Clicks Chart */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-4">
                        Clicks Over Time
                      </h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={url.clicksByDate}>
                          <defs>
                            <linearGradient id={`colorClicks-${url.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af" 
                            style={{ fontSize: '10px' }} 
                          />
                          <YAxis stroke="#9ca3af" style={{ fontSize: '10px' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill={`url(#colorClicks-${url.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-400">Country and device analytics are not available yet.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
