'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function GalleryPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const galleryItems = [
    {
      id: 1,
      title: 'DNA Mutation',
      category: 'dna',
      icon: '🧬',
      color: 'from-purple-600 to-pink-600',
      description: 'Explore genetic variants and mutations',
    },
    {
      id: 2,
      title: 'Protein Folding',
      category: 'protein',
      icon: '🔬',
      color: 'from-cyan-600 to-blue-600',
      description: 'Visualize 3D protein structures',
    },
    {
      id: 3,
      title: 'Gene Network',
      category: 'network',
      icon: '🌐',
      color: 'from-amber-500 to-orange-600',
      description: 'Biological pathway interactions',
    },
    {
      id: 4,
      title: 'Cell Simulation',
      category: 'cell',
      icon: '🫀',
      color: 'from-red-600 to-pink-600',
      description: 'Cellular structure visualization',
    },
    {
      id: 5,
      title: 'Molecular Bonds',
      category: 'molecule',
      icon: '⚛️',
      color: 'from-green-600 to-emerald-600',
      description: 'Atomic and molecular structures',
    },
    {
      id: 6,
      title: 'Disease Pathway',
      category: 'disease',
      icon: '🔴',
      color: 'from-rose-600 to-red-600',
      description: 'Rare disease mechanisms',
    },
  ];

  const filters = [
    { id: 'all', label: 'All Models' },
    { id: 'dna', label: 'DNA' },
    { id: 'protein', label: 'Proteins' },
    { id: 'network', label: 'Networks' },
  ];

  const filteredItems =
    selectedFilter === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedFilter);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      {/* Animated background */}
      <motion.div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </motion.div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="border-b border-purple-500/20 backdrop-blur-md p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto">
            <Link href="/">
              <motion.span className="text-cyan-400 font-bold mb-4 cursor-pointer hover:text-purple-300 inline-block">
                ← Back to Home
              </motion.span>
            </Link>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mt-4">
              3D Model Gallery
            </h1>
            <p className="text-slate-300 text-lg mt-4">
              Explore our collection of interactive 3D molecular visualizations
            </p>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-16">
          {/* Filter Tabs */}
          <motion.div
            className="flex flex-wrap gap-4 mb-12 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-600/50'
                    : 'bg-white/5 border border-purple-500/30 text-purple-300 hover:border-cyan-400/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Gallery Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-purple-500/30 backdrop-blur-md h-80 cursor-pointer"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                  <div>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {item.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-300 text-sm">{item.description}</p>
                  </div>

                  {/* Hover button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="text-cyan-400 font-bold text-sm flex items-center gap-2"
                  >
                    Explore →
                  </motion.div>
                </div>

                {/* Animated border */}
                <motion.div
                  className={`absolute inset-0 border-2 border-transparent rounded-2xl group-hover:border-cyan-400 transition-all`}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Section */}
          <motion.div
            className="mt-20 p-12 rounded-2xl bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 backdrop-blur-md"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-4">
                  Advanced Visualization Engine
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Our custom 3D visualization engine uses React Three Fiber and
                  WebGL to render complex molecular structures in real-time. Each
                  model is interactive, allowing you to rotate, zoom, and explore
                  from every angle.
                </p>
                <motion.ul className="space-y-3">
                  {[
                    'Real-time 3D rendering',
                    'Interactive rotation & zoom',
                    'Molecular bond visualization',
                    'Multi-model comparison',
                  ].map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 text-slate-300"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-cyan-400">✨</span>
                      {feature}
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
              <motion.div
                className="text-7xl text-center"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎨
              </motion.div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/upload">
              <motion.button
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/50"
                whileHover={{
                  scale: 1.08,
                  boxShadow: '0 0 50px rgba(6, 182, 212, 0.7)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Analysis
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
