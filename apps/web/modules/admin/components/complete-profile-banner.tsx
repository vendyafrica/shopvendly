"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CompleteProfileBannerProps {
  storeId: string;
  storeSlug: string;
  isProfileComplete: boolean;
}

export function CompleteProfileBanner({
  storeId,
  storeSlug,
  isProfileComplete,
}: CompleteProfileBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissed state on mount
  useEffect(() => {
    const dismissKey = `vendly_profile_banner_dismissed_${storeId}`;
    const wasDismissed = localStorage.getItem(dismissKey) === "true";
    setIsDismissed(wasDismissed);
  }, [storeId]);

  if (isProfileComplete || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    const dismissKey = `vendly_profile_banner_dismissed_${storeId}`;
    localStorage.setItem(dismissKey, "true");
    setIsDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mb-6 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 p-4 flex gap-4 items-start"
    >
      {/* Icon */}
      <div className="flex-shrink-0 text-xl text-amber-700">✦</div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-amber-900 mb-1">
          Complete your store profile
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed mb-3">
          Add your location, description, and product categories to help customers find you.
        </p>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <Link
            href={`/admin/${storeSlug}/settings`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-md transition-colors"
          >
            Complete
            <span>→</span>
          </Link>
          <button
            onClick={handleDismiss}
            className="text-xs text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-md transition-colors underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}
