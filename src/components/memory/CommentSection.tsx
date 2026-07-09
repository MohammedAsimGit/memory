'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Comment } from '@/types';
import { formatRelative } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface CommentSectionProps {
  memoryId: string;
  comments: Comment[];
  onAdd: (content: string) => void;
}

export default function CommentSection({ memoryId, comments, onAdd }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd(content.trim());
    setContent('');
    setShowInput(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800">Comments ({comments.length})</h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-sm text-[#2196F3] font-medium"
        >
          {showInput ? 'Cancel' : 'Add'}
        </button>
      </div>

      {showInput && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-4 overflow-hidden"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="w-full bg-sky-50/80 rounded-2xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 border border-white/50 resize-none mb-2"
          />
          <Button onClick={handleSubmit} size="sm" disabled={!content.trim()}>
            Post
          </Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {comments.map((comment, i) => (
          <motion.div
            key={comment._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#4FC3F7] to-[#1976D2] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {comment.author[0]}
            </div>
            <div className="flex-1 bg-sky-50/50 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-700">{comment.author}</span>
                <span className="text-[10px] text-slate-400">{formatRelative(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600">{comment.content}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
