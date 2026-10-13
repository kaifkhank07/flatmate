"use client";

import React, { useState } from "react";
import SectionHeading from "@/components/utils/SectionHeading";
import { useFaqData } from "@/data/faq";
import { ChevronDown } from "lucide-react";
import { ViewReveal } from "../animation";

export default function Faq() {
  const faqList = useFaqData();
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-16 bg-background overflow-hidden">
      <div className="w-full max-w-8xl 3xl:max-w-[1450px] mx-auto space-y-6 sm:space-y-10 md:space-y-12">
        <ViewReveal duration={800}>
          <SectionHeading
            title="Frequently Asked Questions"
            description="Quick Answers To Common Queries."
            align="left"
          />
        </ViewReveal>

        <ViewReveal duration={900} startDelay={150}>
          <div className="w-full space-y-4">
            {faqList.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="border-b border-[#82C3F5]/50 pb-4 transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full flex items-center justify-between py-3 text-left focus:outline-none group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg md:text-xl font-regular text-black/90 group-hover:text-brand-blue transition-colors">
                      {item.number} {item.question}
                    </span>
                    <div
                      className={`p-1 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand-blue" : "text-black/60"
                        }`}
                    >
                      <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-2 mb-2"
                      : "grid-rows-[0fr] opacity-0"
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm sm:text-base font-regular text-black/65 leading-relaxed pl-6 sm:pl-7">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ViewReveal>
      </div>
    </section>
  );
}
