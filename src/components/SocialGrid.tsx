'use client';
import { useState, useEffect } from 'react';
import SocialCard from './SocialCard';
import { socials } from '@/data/socials';
import { motion } from 'framer-motion';
import CopySectionLink from './CopySectionLink';

export default function SocialGrid() {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/clicks')
      .then(r => r.json())
      .then(setClickCounts)
      .catch(() => {/* silently ignore — counts just show 0 */});
  }, []);

  const onIncrement = (id: string, newCount: number) => {
    setClickCounts(prev => ({ ...prev, [id]: newCount }));
  };

  // Separate projects and main socials
  const projectIds = ['github', 'tmtbl', 'cursor-pack', 'dotfiles'];
  const projects = socials.filter((s) => projectIds.includes(s.id));
  const mainSocials = socials.filter((s) => !projectIds.includes(s.id));

  // Explicit visual order for the bento grid
  const socialOrder = [
    'anilist', 'discord', 'spotify',
    'steam', 'instagram', 'youtube', 'riot',
    'fluxer', 'email',
  ];
  const sortedSocials = socialOrder
    .map((id) => mainSocials.find((s) => s.id === id))
    .filter(Boolean) as typeof mainSocials;

  return (
    <div className="layout-wrapper">
      {/* Bento Grid for Socials */}
      <section className="section-container" id="socials">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="section-header-wrapper"
        >
          <h2 className="section-title">Socials</h2>
          <CopySectionLink sectionId="socials" />
        </motion.div>
        <div className="bento-grid">
          {sortedSocials.map((social, i) => (
            <div key={social.id} className="bento-item" data-id={social.id}>
              <SocialCard
                social={social}
                index={i}
                initialCount={clickCounts[social.id] ?? 0}
                onIncrement={onIncrement}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="section-container projects-section" id="featuredprojects">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header-wrapper"
        >
          <h2 className="section-title">Featured Projects</h2>
          <CopySectionLink sectionId="featuredprojects" />
        </motion.div>
        <div className="projects-grid">
          {projects.map((project, i) => (
            <div key={project.id} className="project-item" data-id={project.id}>
              <SocialCard
                social={project}
                index={i + mainSocials.length}
                initialCount={clickCounts[project.id] ?? 0}
                onIncrement={onIncrement}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
