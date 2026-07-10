'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Comment } from '@/types';
import { formatRelative } from '@/lib/utils';
import AuthorAvatar from '@/components/post/AuthorAvatar';
import AuthorBadge from '@/components/post/AuthorBadge';
import Button from '@/components/ui/Button';

interface CommentSectionProps {
  memoryId: string;
  comments: Comment[];
  onAdd: (content: string) => void;
  submitting?: boolean;
}

export default function CommentSection({ memoryId, comments, onAdd, submitting }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setValidationError('Comment cannot be empty.');
      return;
    }
    setValidationError('');
    onAdd(trimmed);
    setContent('');
    setShowInput(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
          Comments <span className="text-slate-400 dark:text-slate-500 font-normal">({comments.length})</span>
        </h3>
        <button
          onClick={() => {
            setShowInput(!showInput);
            setValidationError('');
          }}
          className="text-sm text-[#2196F3] dark:text-sky-400 font-medium hover:underline"
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
            onChange={(e) => {
              setContent(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="Write a comment..."
            rows={2}
            maxLength={2000}
            className="w-full bg-sky-50/80 dark:bg-slate-700/50 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 border border-white/50 dark:border-slate-600/50 resize-none mb-2"
          />
          {validationError && (
            <p className="text-xs text-red-500 mb-2">{validationError}</p>
          )}
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!content.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </motion.div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            No comments yet. Start the conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment, i) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3"
            >
              <AuthorAvatar name={comment.author} size="sm" />
              <div className="flex-1 bg-sky-50/50 dark:bg-slate-700/30 rounded-2xl p-3 border border-white/50 dark:border-slate-600/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {comment.author === 'me' ? 'Asim' : comment.author}
                  </span>
                  <AuthorBadge name={comment.author} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                    {formatRelative(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
