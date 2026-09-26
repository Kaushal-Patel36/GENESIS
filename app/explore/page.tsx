'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import DNAHelix3D from '@/components/dna-helix-3d';
import Protein3D from '@/components/protein-3d';
import { useState } from 'react';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('dna');

  const tabs = [
    { id: 'dna', label: 'DNA Helix', icon: '🧬' },
    { id: 'protein', label: 'Protein Structure', icon: '🔬' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      {/* Animated background */}
      <motion.div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </motion.div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="sticky top-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent backdrop-blur-md border-b border-purple-500/20 p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/">
              <motion.span className="text-2xl font-bold text-cyan-400 cursor-pointer hover:text-purple-300">
                ← GENESIS
              </motion.span>
            </Link>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              3D Molecular Explorer
            </h1>
            <div className="w-20" />
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-12">
          {/* Tab Navigation */}
          <motion.div
            className="flex gap-4 mb-8 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-bold transition-all text-lg ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-600/50'
                    : 'bg-white/5 border border-purple-500/30 text-purple-300 hover:border-cyan-400/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Main 3D Viewer */}
          <motion.div
            className="rounded-2xl overflow-hidden border border-purple-500/30 backdrop-blur-md mb-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-screen bg-gradient-to-b from-slate-900/50 to-slate-950">
              {activeTab === 'dna' ? <DNAHelix3D /> : <Protein3D />}
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {activeTab === 'dna' && (
              <>
                <motion.div
                  className="p-8 rounded-2xl bg-white/5 border border-purple-500/30 backdrop-blur-md"
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                    DNA Double Helix
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    The DNA molecule is a double helix structure that contains the
                    genetic instructions for life. Each strand is made of
                    nucleotides (A, T, G, C) that form base pairs, creating the
                    rungs of the helix ladder. Our visualization shows you the
                    beautiful symmetry of this fundamental molecule.
                  </p>
                </motion.div>
                <motion.div
                  className="p-8 rounded-2xl bg-white/5 border border-cyan-500/30 backdrop-blur-md"
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <h3 className="text-2xl font-bold text-purple-300 mb-4">
                    Genetic Information
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    DNA carries 3 billion base pairs that encode genetic
                    information. Mutations in these sequences can lead to various
                    diseases. In GENESIS, we analyze these variants against
                    phenotypic data to identify rare disease mutations with
                    unprecedented accuracy.
                  </p>
                </motion.div>
              </>
            )}

            {activeTab === 'protein' && (
              <>
                <motion.div
                  className="p-8 rounded-2xl bg-white/5 border border-purple-500/30 backdrop-blur-md"
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                    Protein Folding
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Proteins are complex 3D molecules folded from amino acid
                    sequences. Their structure determines their function in the
                    cell. Misfolded proteins can cause diseases. Our 3D viewer
                    helps visualize how genetic mutations might affect protein
                    structure and function.
                  </p>
                </motion.div>
                <motion.div
                  className="p-8 rounded-2xl bg-white/5 border border-cyan-500/30 backdrop-blur-md"
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <h3 className="text-2xl font-bold text-purple-300 mb-4">
                    Molecular Networks
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Proteins interact in complex networks to carry out cellular
                    functions. Disruptions in these networks can lead to disease.
                    GENESIS maps these interactions to understand how genetic
                    variants propagate through biological systems.
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Interactive Controls Info */}
          <motion.div
            className="p-8 rounded-2xl bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 backdrop-blur-md mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-4">
              How to Interact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl mb-2">🖱️</div>
                <p className="text-slate-300">
                  <strong>Rotate:</strong> Drag to rotate the molecule
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-slate-300">
                  <strong>Zoom:</strong> Scroll to zoom in/out
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">⏱️</div>
                <p className="text-slate-300">
                  <strong>Rotate:</strong> Auto-rotation enabled
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/upload">
              <motion.button
                className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/50"
                whileHover={{
                  scale: 1.08,
                  boxShadow: '0 0 50px rgba(6, 182, 212, 0.7)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                Upload Your Data
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
