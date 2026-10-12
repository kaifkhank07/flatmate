import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import Stats from "@/components/about/Stats";
import Faq from "@/components/ui/Faq";
import JoinCommunityBanner from "@/components/ui/JoinCommunityBanner";

export default function AboutPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <AboutHero />
      <OurStory />
      <Stats />
      <JoinCommunityBanner />
      <Faq />
    </main>
  );
}
