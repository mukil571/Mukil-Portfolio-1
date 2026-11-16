import { motion } from 'framer-motion';
import ScrambleText from './ScrambleText.jsx';

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className="relative z-10 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="mb-12 flex items-end justify-between gap-8 sm:mb-16">
            <div>
              <motion.p variants={fadeUp} className="section-heading mb-3">
                <ScrambleText text={kicker} speed={60} />
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight"
              >
                <ScrambleText text={title} delay={150} speed={55} />
              </motion.h2>
            </div>
            {/* empty slot the WebGL particles form this section's shape in */}
            <div
              data-shape-anchor={id}
              className="hidden h-[230px] w-[340px] shrink-0 lg:block"
              aria-hidden="true"
            />
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
