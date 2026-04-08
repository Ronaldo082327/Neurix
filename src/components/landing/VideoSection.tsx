import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState, useRef } from "react";
import heroVideo from "@/assets/neurix-hero-video.mp4";

export function VideoSection() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />
      <div className="container px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto relative rounded-2xl overflow-hidden border border-border/50 glow-blue"
        >
          <video
            ref={videoRef}
            src={heroVideo}
            className="w-full aspect-video object-cover"
            loop
            muted
            playsInline
            onEnded={() => setPlaying(false)}
          />

          {!playing && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm cursor-pointer group"
              onClick={handlePlay}
            >
              <div className="h-20 w-20 rounded-full gradient-primary-bg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
