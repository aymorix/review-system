import React, { useState } from 'react';
import { generateSingleAiReview } from '../services/aiService';
import { submitToGoogleSheets }   from '../services/googleSheetsService';
import { saveLocalReview }        from '../services/storageService';
import { StarRating }             from './StarRating';
import {
  User, Send, RefreshCw, Wand2, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

export const ReviewForm = ({ config, onOpenSuccess, isAiGenerated, setIsAiGenerated, reviewComment, setReviewComment }) => {
  const [name,        setName]        = useState('');
  const [rating,      setRating]      = useState(5);
  const [answers,     setAnswers]     = useState({
    q1: config.questions[0]?.options[0] || '',
    q2: config.questions[1]?.options[0] || '',
    q3: config.questions[2]?.options[0] || '',
    q4: config.questions[3]?.options[0] || '',
    q5: config.questions[4]?.options[0] || ''
  });
  const [submitting,  setSubmitting]  = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [genCount,    setGenCount]    = useState(0);
  const [errorMsg,    setErrorMsg]    = useState('');

  const select = (qId, opt) => setAnswers(p => ({ ...p, [qId]: opt }));

  /* Calculate completion percentage */
  const filledCount = [
    name.trim() !== '',
    !!answers.q1,
    !!answers.q2,
    !!answers.q3,
    !!answers.q4,
    !!answers.q5,
    rating > 0,
    reviewComment.trim() !== ''
  ].filter(Boolean).length;

  const progressPercent = Math.round((filledCount / 8) * 100);

  const handleAiMode = async () => {
    setGenerating(true);
    try {
      const text = await generateSingleAiReview({
        name,
        rating,
        answers,
        questions: config.questions,
        grokApiKey: config.grokApiKey,
        geminiApiKey: config.geminiApiKey
      });
      setReviewComment(text);
      setIsAiGenerated(true);
      setGenCount(c => c + 1);
    } catch(e) { 
      console.error(e); 
    }
    finally { 
      setGenerating(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { 
      setErrorMsg('Please enter your full name to submit.'); 
      return; 
    }
    if (!reviewComment.trim()) {
      setErrorMsg('Please write your review comment or tap AI Mode to generate one.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      timestamp: new Date().toISOString(),
      name: name.trim(),
      rating,
      q1: answers.q1, 
      q2: answers.q2, 
      q3: answers.q3, 
      q4: answers.q4, 
      q5: answers.q5,
      comment: reviewComment.trim(),
      aiUsed: isAiGenerated ? 'Yes' : 'No'
    };

    saveLocalReview(payload);
    await submitToGoogleSheets(config, payload);
    setSubmitting(false);
    onOpenSuccess({ reviewText: payload.comment, rating });
  };

  return (
    <form onSubmit={handleSubmit} className="main-form-card">

      {/* Announcement Banner */}
      <div className="help-banner">
        <strong>HELP US IMPROVE!</strong> We value your feedback.
      </div>

      {/* Progress Bar Block */}
      <div className="progress-block">
        <div className="progress-header">
          <span className="progress-label">
            <Sparkles size={13} color="#1847F0" />
            Form Progress
          </span>
          <span className="progress-value">{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Name Input Section */}
      <div className="phone-question-item">
        <label className="phone-question-title">
          <User size={15} style={{ display:'inline', marginRight:6, verticalAlign:'-2px' }} />
          Your Full Name <span style={{ color:'#ef4444' }}>*</span>
        </label>
        <input
          className="input-field"
          type="text"
          placeholder="Enter your full name..."
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      {/* Questions 1 to 5 (Horizontal Segmented Control Pills - 3 options each) */}
      {config.questions.map((q, idx) => {
        const availableOptions = q.options ? q.options.slice(0, 3) : [];
        return (
          <div key={q.id} className="phone-question-item">
            <label className="phone-question-title">
              {idx + 1}. {q.label}
            </label>
            <div className="segmented-track">
              {availableOptions.map(opt => {
                const sel = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`segmented-btn${sel ? ' selected' : ''}`}
                    onClick={() => select(q.id, opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Star Rating Section */}
      <div className="phone-star-section">
        <StarRating rating={rating} onChange={setRating} />
      </div>

      {/* Additional Comments & AI Mode (Compulsory) */}
      <div className="phone-feedback-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <label className="phone-feedback-title">
            ADDITIONAL COMMENTS &amp; FEEDBACK <span style={{ color:'#ef4444' }}>*</span>
          </label>

          <button
            type="button"
            className="btn-ai"
            onClick={handleAiMode}
            disabled={generating}
          >
            {generating ? (
              <><RefreshCw size={13} className="spin" /> Magic Writing...</>
            ) : (
              <><Wand2 size={13} /> {genCount > 0 ? 'New AI Review' : 'AI Mode'}</>
            )}
          </button>
        </div>

        <textarea
          className="input-field"
          placeholder="Share your thoughts, suggestions, or feedback..."
          value={reviewComment}
          required
          onChange={e => {
            setReviewComment(e.target.value);
            setIsAiGenerated(false);
          }}
        />

        {isAiGenerated && (
          <div className="ai-badge">
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle2 size={14} color="#1847F0" />
              AI Review Generated (#{genCount})
            </span>
            <button
              type="button"
              className="ai-badge-regen"
              onClick={handleAiMode}
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="error-box">
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary"
        disabled={submitting}
      >
        <span>{submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}</span>
        <Send size={16} />
      </button>

    </form>
  );
};
