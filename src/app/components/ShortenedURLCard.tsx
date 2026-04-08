import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Copy, Check, ExternalLink, BarChart3, PartyPopper, QrCode, Download } from 'lucide-react';
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

interface ShortenedURLCardProps {
  url: ShortenedURL;
}

export function ShortenedURLCard({ url }: ShortenedURLCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code') as HTMLElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${url.shortCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const createdLabel = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(url.createdAt);
  const isExpired = Boolean(url.expiresAt && url.expiresAt.getTime() <= Date.now());
  const statusLabel = isExpired ? "Expired" : "Live";

  return (
    <div className="space-y-4">
      <motion.div
        className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="flex items-center gap-3 mb-6 relative z-10"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="bg-white/20 backdrop-blur-sm p-2 rounded-lg"
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.3, 0.6, 1],
            }}
          >
            <PartyPopper className="size-6" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-lg">Success! Your link is ready</h3>
            <p className="text-blue-100 text-sm">Share it anywhere you like</p>
          </div>
        </motion.div>

        {/* Shortened URL Display */}
        <motion.div
          className="bg-white rounded-xl p-4 mb-4 relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Your shortened URL</p>
              <motion.p
                className="text-blue-600 font-semibold text-lg truncate"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {url.shortUrl}
              </motion.p>
            </div>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleCopy}
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <motion.div
                    animate={copied ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        Copy
                      </>
                    )}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Original URL */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <p className="text-xs text-blue-100 mb-1">Original URL</p>
          <p className="text-white text-sm truncate">{url.originalUrl}</p>
          {url.customAlias && (
            <p className="text-xs text-blue-200 mt-2">
              Custom alias: <span className="font-semibold">{url.customAlias}</span>
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowQR(!showQR)}
              className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
            >
              <QrCode className="size-4 mr-2" />
              {showQR ? 'Hide QR' : 'Show QR'}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowStats(!showStats)}
              className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
            >
              <BarChart3 className="size-4 mr-2" />
              {showStats ? 'Hide Stats' : 'View Stats'}
            </Button>
          </motion.div>
        </div>

        {/* QR Code Display */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              className="bg-white rounded-xl p-6 mb-4 relative z-10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    id="qr-code"
                    value={url.shortUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <Button
                  onClick={downloadQR}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Download className="size-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BarChart3 className="size-4 text-blue-200" />
              </motion.div>
              <p className="text-xs text-blue-100">Clicks</p>
            </div>
            <motion.p
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {url.clicks}
            </motion.p>
          </motion.div>
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ExternalLink className="size-4 text-blue-200" />
              </motion.div>
              <p className="text-xs text-blue-100">Status</p>
            </div>
            <motion.p
              className={`text-xl font-bold ${isExpired ? "text-red-400" : "text-green-400"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {statusLabel}
            </motion.p>
          </motion.div>
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            <p className="text-xs text-blue-100 mb-2">Created</p>
            <motion.p
              className="text-sm font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {createdLabel}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Detailed Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="size-5 text-purple-400" />
              Detailed Analytics
            </h3>

            {/* Clicks Over Time Chart */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Clicks Over Last 7 Days</h4>
              <div className="bg-white/5 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={url.clicksByDate}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
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
                      fill="url(#colorClicks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-sm text-gray-400">Country and device analytics are not available yet.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
