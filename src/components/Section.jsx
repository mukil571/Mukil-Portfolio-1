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
    <section id={id} className="relative z-10 px-6 py-16 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="mb-8 flex flex-col gap-4 sm:mb-12 lg:mb-16 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
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
            {/* empty slot the WebGL particles form this section's shape in:
                a strip under the title on phones/tablets, a box beside it on desktop */}
            <div
              data-shape-anchor={id}
              className="h-[150px] w-full shrink-0 sm:h-[180px] lg:h-[230px] lg:w-[340px]"
              aria-hidden="true"
            />
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
