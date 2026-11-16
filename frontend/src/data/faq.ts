"use client";

export interface FaqItem {
  id: string;
  number: string;
  question: string;
  answer: string;
}

export const useFaqData = (): FaqItem[] => {
  return [
    {
      id: "faq-1",
      number: "1.",
      question: "How does the matching process work?",
      answer:
        "Our intelligent matching algorithm evaluates your lifestyle preferences, budget, location choices, and move-in timeline to suggest compatible flatmates and verified property listings.",
    },
    {
      id: "faq-2",
      number: "2.",
      question: "How do I list my room or find a flatmate?",
      answer:
        "Simply create a free account, complete your profile, and click on 'Post a Listing'. You can add photos, amenities, rent details, and flatmate preferences in just a few simple steps.",
    },
    {
      id: "faq-3",
      number: "3.",
      question: "Are all profiles and properties verified?",
      answer:
        "Yes, safety is our top priority. We verify government ID proofs, phone numbers, and property ownership details to ensure authentic users and real listings on our platform.",
    },
    {
      id: "faq-4",
      number: "4.",
      question: "How can I contact potential flatmates safely?",
      answer:
      "You can use our secure in-app messaging feature to chat with potential flatmates or landlords before sharing personal contact details or scheduling room visits.",
    },
    // {
    //   id: "faq-5",
    //   number: "5.",
    //   question: "Is there any brokerage fee involved?",
    //   answer:
    //     "No, our platform directly connects tenants with owners or existing flatmates, eliminating hefty brokerage fees and middleman charges.",
    // },
  ];
};
