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
  const [showInterview, setShowInterview] = useState(false);
  
  const application = job.applications?.[0];
  const [interviewDate, setInterviewDate] = useState(application?.interview_date?.split('T')[0] || '');
  const [interviewNotes, setInterviewNotes] = useState(application?.interview_notes || '');
  const [interviewerNames, setInterviewerNames] = useState(application?.interviewer_names || '');
  const [isSavingInterview, setIsSavingInterview] = useState(false);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [prepData, setPrepData] = useState<any>(application?.generated_interview_prep || null);

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

  const handleSaveInterview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!application) {
      alert('No application found for this job. You must apply or customize a resume first.');
      return;
    }

    setIsSavingInterview(true);
    try {
      await JobSearchAPI.updateApplication(application.id, {
        interview_date: interviewDate ? new Date(interviewDate).toISOString() : null,
        interview_notes: interviewNotes,
        interviewer_names: interviewerNames,
      });
      setIsSavingInterview(false);
      setShowInterview(false);
    } catch (err) {
      console.error('Failed to save interview info:', err);
      alert('Failed to save interview info');
      setIsSavingInterview(false);
    }
  };

  const handleGeneratePrep = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!application) {
      alert('No application found for this job. You must apply or customize a resume first.');
      return;
    }

    setIsGeneratingPrep(true);
    try {
      const data = await JobSearchAPI.getInterviewPrep(application.id);
      setPrepData(data);
    } catch (err) {
      console.error('Failed to generate prep:', err);
      alert('Failed to generate interview prep: ' + (err as Error).message);
    } finally {
      setIsGeneratingPrep(false);
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

        {/* Interview Section */}
        <div className="mt-2 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInterview(!showInterview);
            }}
            className={`text-[10px] flex items-center gap-1 transition-colors ${
              application?.interview_date ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {showInterview ? '▼ Hide Interview' : '▶ Manage Interview'} {application?.interview_date && !showInterview && '🗓️'}
          </button>
          
          {showInterview && (
            <div className="mt-2 space-y-3 p-3 bg-white/5 rounded-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold">Interview Date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full p-1.5 text-xs bg-black/20 border border-white/10 rounded outline-none text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold">Interviewers</label>
                <input
                  type="text"
                  value={interviewerNames}
                  onChange={(e) => setInterviewerNames(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="e.g. Jane Smith, John Doe"
                  className="w-full p-1.5 text-xs bg-black/20 border border-white/10 rounded outline-none text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold">Prep Notes</label>
                <textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full p-1.5 text-xs bg-black/20 border border-white/10 rounded outline-none text-white min-h-[40px]"
                  placeholder="Questions to ask, points to mention..."
                />
              </div>
              <div className="flex gap-2">
                <button
                    onClick={handleSaveInterview}
                    disabled={isSavingInterview}
                    className="flex-1 text-[10px] bg-white/10 hover:bg-white/20 text-white py-1.5 rounded transition-all"
                >
                    {isSavingInterview ? 'Saving...' : 'Save Manual Info'}
                </button>
                <button
                    onClick={handleGeneratePrep}
                    disabled={isGeneratingPrep}
                    className="flex-1 text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-1.5 rounded transition-all flex items-center justify-center gap-1"
                >
                    {isGeneratingPrep ? '✨ Generating...' : '✨ AI Interview Prep'}
                </button>
              </div>

              {/* AI Prep Results */}
              {prepData && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-purple-400 uppercase">Behavioral Questions</h4>
                        {prepData.behavioral_questions.map((q: any, i: number) => (
                            <div key={i} className="p-2 bg-black/20 rounded border border-white/5 space-y-1">
                                <p className="text-[11px] font-bold text-white">Q: {q.question}</p>
                                <p className="text-[9px] text-gray-400"><span className="text-purple-300/60">Why:</span> {q.why_ask}</p>
                                <p className="text-[9px] text-gray-400"><span className="text-purple-300/60">Points:</span> {q.talking_points}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase">Technical Questions</h4>
                        {prepData.technical_questions.map((q: any, i: number) => (
                            <div key={i} className="p-2 bg-black/20 rounded border border-white/5 space-y-1">
                                <p className="text-[11px] font-bold text-white">Q: {q.question}</p>
                                <p className="text-[9px] text-gray-400"><span className="text-blue-300/60">Topics:</span> {q.expected_topics}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-green-400 uppercase">Company Research</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {prepData.company_research.map((r: string, i: number) => (
                                <li key={i} className="text-[10px] text-gray-400">{r}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-orange-400 uppercase">Questions to Ask</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {prepData.questions_to_ask.map((q: string, i: number) => (
                                <li key={i} className="text-[10px] text-gray-400">{q}</li>
                            ))}
                        </ul>
                    </div>
                    <button 
                        onClick={() => {
                            const blob = new Blob([JSON.stringify(prepData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `interview-prep-${job.company}.json`;
                            a.click();
                        }}
                        className="w-full text-[9px] text-gray-500 hover:text-gray-400 text-center"
                    >
                        Download Prep Guide (JSON)
                    </button>
                </div>
              )}
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
