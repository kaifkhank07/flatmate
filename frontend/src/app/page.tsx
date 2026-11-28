import Hero from "@/components/home/Hero";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import LookingFor from "@/components/home/LookingFor";
import Community from "@/components/home/Community";
import ExploreListings from "@/components/home/ExploreListings";
import Cta from "@/components/home/Cta";
import ExploreCities from "@/components/home/ExploreCities";
import Testimonials from "@/components/home/Testimonials";
import Faq from "@/components/ui/Faq";
import JoinCommunityBanner from "@/components/ui/JoinCommunityBanner";

export default function Home() {
  return (
    <main className="w-full min-h-screen">
      <Hero />
      <LookingFor />
      <Community />
      <WhyChooseUs />
      <ExploreListings />
      <Cta />
      <ExploreCities />
      <Testimonials />
      <Faq />
      <JoinCommunityBanner />
    </main>
  );
}
