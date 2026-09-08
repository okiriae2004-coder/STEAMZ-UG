import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { X, Star, ThumbsUp, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeedbackModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_TAGS = [
  'Piping Hot on Arrival',
  'Fresh Ingredients',
  'Locker PIN Worked Instantly',
  'Drop Spot Easy to Find',
  'Thermal Packaging Top-tier',
  'On-time Drop',
  'Generous Portion',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, isOpen, onClose }) => {
  const { addFeedback } = useApp();

  const [overallRating, setOverallRating] = useState(5);
  const [foodQualityRating, setFoodQualityRating] = useState(5);
  const [spotDeliveryRating, setSpotDeliveryRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Piping Hot on Arrival',
    'Locker PIN Worked Instantly',
  ]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addFeedback({
      orderId: order.id,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      customerName: order.customerName,
      overallRating,
      foodQualityRating,
      spotDeliveryRating,
      tags: selectedTags,
      comment: comment || 'Delicious meal delivered promptly to my STEAMZ locker pod!',
      dropSpotId: order.dropSpotId,
      dropSpotName: order.dropSpotName,
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const renderStarSelector = (
    value: number,
    onChange: (val: number) => void,
    label: string
  ) => (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-stone-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition"
          >
            <Star
              className={`h-5 w-5 ${
                star <= value
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-stone-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              User Feedback
            </span>
            <h3 className="text-lg font-bold text-stone-900">
              Rate your order from {order.restaurantName}
            </h3>
            <p className="text-xs text-stone-500">
              Drop Spot: {order.dropSpotName} ({order.dropSpotLockerCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-stone-900">Feedback Submitted!</h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Your feedback helps {order.restaurantName} and the STEAMZ spot-drop logistics team maintain top standards.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Star Ratings */}
            <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200 space-y-3">
              {renderStarSelector(overallRating, setOverallRating, 'Overall Experience')}
              {renderStarSelector(foodQualityRating, setFoodQualityRating, 'Food Quality & Taste')}
              {renderStarSelector(spotDeliveryRating, setSpotDeliveryRating, 'Spot Drop-off & Locker Experience')}
            </div>

            {/* Quick tags */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-2">
                What went well? (Select tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Detailed Feedback / Notes for Restaurant & Courier
              </label>
              <textarea
                rows={3}
                placeholder="How was the meal temperature? Was the designated locker spot convenient?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 text-sm font-medium hover:bg-stone-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-sm transition"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
