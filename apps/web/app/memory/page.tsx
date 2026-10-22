'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Edit2, Download, Search, Tag, Check, Sparkles } from 'lucide-react';

interface MemoryItem {
  id: string;
  category: 'preference' | 'project' | 'goal' | 'workflow' | 'fact' | 'routine';
  content: string;
  confidence: number;
}

export default function MemoryDashboard() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.error('Failed to load memories:', e);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory, content: newContent })
      });
      if (res.ok) {
        setNewContent('');
        setIsAdding(false);
        fetchMemories();
      }
    } catch (e) {
      alert('Failed to save memory.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want Jarvis to forget this memory?')) return;
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMemories();
      }
    } catch (e) {
      alert('Failed to delete memory.');
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'jarvis_memories_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Long-term Memory Store</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Jarvis gradually learns your preferences, routines, and ongoing projects. You have 100% control to inspect, edit, or delete them anytime.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm transition-all"
            title="Export memories to JSON"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Add Memory Modal/Form */}
      {isAdding && (
        <form onSubmit={handleAddMemory} className="my-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 shadow-md">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Teach Jarvis a New Preference or Fact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
            >
              <option value="preference">Preference</option>
              <option value="project">Ongoing Project</option>
              <option value="goal">Important Goal</option>
              <option value="workflow">Workflow Routine</option>
              <option value="fact">Personal Fact</option>
            </select>
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Always explain code with inline comments"
              className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {['all', 'preference', 'project', 'goal', 'workflow', 'fact'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full capitalize font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Tag className="w-3 h-3 mr-1" />
                  {m.category}
                </span>

                <span className="text-[10px] text-slate-400">
                  Confidence: {Math.round(m.confidence * 100)}%
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                {m.content}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-[11px]">
                <Check className="w-3.5 h-3.5 mr-1" />
                Active in context
              </span>

              <button
                onClick={() => handleDelete(m.id)}
                className="text-rose-500 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Forget this memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No memories found matching your search. Chat with Jarvis or tap "Add Memory" to store facts.
        </div>
      )}
    </div>
  );
}
