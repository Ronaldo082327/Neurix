import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CognitiveGraph } from "@/components/landing/CognitiveGraph";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ScienceSection } from "@/components/landing/ScienceSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PreLaunchSection } from "@/components/landing/PreLaunchSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FooterSection } from "@/components/landing/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grain">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CognitiveGraph />
      <HowItWorksSection />
      <ScienceSection />
      <TestimonialsSection />
      <PricingSection />
      <PreLaunchSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default Index;
