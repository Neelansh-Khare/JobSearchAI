'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GlassCard from '@/components/GlassCard';
import { JobSearchAPI } from '@/services/api'; // Import API
import { Job } from '@/types';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  onDelete: (id: number) => void;
}

export default function JobCard({ job, onDelete }: JobCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAutoApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.url) return;
    
    if (!confirm(`Auto-apply to ${job.company}? This will open a browser window.`)) return;

    setIsApplying(true);
    try {
      await JobSearchAPI.autoApply(job.url);
      alert('Automation completed! Check the output folder for a screenshot.');
    } catch (err) {
      alert('Failed to apply: ' + (err as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GlassCard className="p-4 mb-3 cursor-move hover:bg-white/10 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{job.title}</h3>
            <p className="text-sm opacity-80">{job.company}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this job?')) {
                onDelete(job.id);
              }
            }}
            className="text-red-400 hover:text-red-300 ml-2"
            title="Delete job"
          >
            ×
          </button>
        </div>
        <p className="text-xs opacity-70 line-clamp-2 mb-2">{job.description}</p>
        
        <div className="flex items-center justify-between mt-2">
            {job.url && (
            <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-400 hover:text-blue-300"
            >
                View Job →
            </a>
            )}
            
            {job.url && (
            <button
                onClick={handleAutoApply}
                disabled={isApplying}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${
                    isApplying 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/20'
                }`}
                title="Use AI to fill the application form"
            >
                {isApplying ? (
                    <span>⏳ Applying...</span>
                ) : (
                    <>✨ Auto Apply</>
                )}
            </button>
            )}
        </div>
      </GlassCard>
    </div>
  );
}
