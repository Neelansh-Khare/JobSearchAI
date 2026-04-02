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
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(job.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  const handleSaveNotes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingNotes(true);
    try {
      await JobSearchAPI.updateJob(job.id, { notes });
      setIsSavingNotes(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes');
      setIsSavingNotes(false);
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
        
        {job.network_contacts && job.network_contacts.length > 0 && (
          <div className="mt-1 mb-2">
            <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 inline-flex items-center gap-1">
              🤝 {job.network_contacts.length} {job.network_contacts.length === 1 ? 'Connection' : 'Connections'}
            </span>
          </div>
        )}

        <div className="mt-2 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes(!showNotes);
            }}
            className="text-[10px] text-gray-400 hover:text-gray-300 flex items-center gap-1"
          >
            {showNotes ? '▼ Hide Notes' : '▶ Show Notes'} {job.notes && !showNotes && '📝'}
          </button>
          
          {showNotes && (
            <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full p-2 text-xs bg-white/5 border border-white/10 rounded outline-none focus:border-white/30 min-h-[60px]"
                placeholder="Add notes about this job..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
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
