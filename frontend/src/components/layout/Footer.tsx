"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAssets } from "@/data/assets";
import LineRoll from "@/components/utils/LineRoll";
import { INFO_DATA } from "@/data/info";

export default function Footer() {
  const assets = useAssets();
  const compony = INFO_DATA;

  const quickLinks1 = [
    { title: "Home", href: "/" },
    { title: "Listings", href: "/listing" },
    { title: "About Us", href: "/about" },
    // { title: "Contact Us", href: "/contact" },
    { title: "Blogs", href: "/blog" },
    { title: "Cities", href: "/city" }
  ];

  const quickLinks2 = [
    { title: `${compony.email}`, href: `mailto:${compony.email}` },
    { title: `${compony.mobile}`, href: `tel:${compony.mobile}` },
    { title: "Terms & Conditions", href: "/terms-conditions" },
    { title: "Privacy Policy", href: "/privacy-policy" },
    // { title: "Cities", href: "/city" },
  ];

  return (
    <footer className="w-full border-t border-gray-100">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-16 pt-12 sm:pt-16 pb-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-10 sm:pb-14">
          {/* Column 1: Logo & Agency Description */}
          <div className="lg:col-span-2 space-y-2 sm:space-y-4">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 py-1">
              <Image
                src={assets.logo}
                alt="Flatmate Logo"
                width={140}
                height={44}
                // className="h-12 md:h-16 w-auto object-contain"
                className="h-12 sm:h-14 md:h-20 lg:h-22 w-auto object-contain"
                priority
              />
            </Link>

            <p className="text-black text-sm sm:text-base md:text-[20px] font-regular leading-relaxed max-w-sm">
              An Agency That Brings Your Great Ideas To Life Beyond Web Design And Web Development.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-black text-base sm:text-lg md:text-[22px] font-medium">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks1.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-black text-sm sm:text-base md:text-lg font-regular hover:text-brand-blue transition-colors inline-block"
                  >
                    <LineRoll text={item.title} lineClassName="bg-brand-blue" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-black text-base sm:text-lg md:text-[22px] font-medium">
              Other Links
            </h4>
            <ul className="space-y-2">
              {quickLinks2.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-black text-sm sm:text-base md:text-lg font-regular hover:text-brand-blue transition-colors inline-block"
                  >
                    <LineRoll text={item.title} lineClassName="bg-brand-blue" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Follow Us On */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-black text-base sm:text-lg md:text-[22px] font-medium">
              Follow Us On
            </h4>
            <div className="flex items-center gap-3 pt-1">
              {/* Instagram Icon */}
              {INFO_DATA.social.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0066F9] hover:bg-[#0052C7] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span
                    className="flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar / Copyright */}
        <div className="border-t-2 border-gray-200/80 pt-6 text-center">
          <p className="text-black text-sm sm:text-base font-regular leading-relaxed">
            © 2026 flatandflatmate.in All rights reserved
          </p>
          <p className="text-black text-sm sm:text-base font-regular leading-relaxed">
            Designed and Developed by <Link href="https://buzzlink.in" target="_blank" rel="noopener noreferrer" className="text-brand-blue font-medium inline-block"><LineRoll text="Buzzlink Solutions" lineClassName="bg-brand-blue" /></Link>
          </p>
        </div>
      </div>
    </footer >
  );
}

