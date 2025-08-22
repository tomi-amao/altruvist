import React, { useState, useEffect } from "react";
import { Form } from "react-router";
import { X } from "@phosphor-icons/react";

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  charityId: string;
  charityName: string;
  announcement?: {
    id: string;
    title: string;
    content: string;
  };
  isEditing?: boolean;
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  isOpen,
  onClose,
  charityId,
  charityName,
  announcement,
  isEditing = false,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [isEditing, announcement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("charityId", charityId);

      const url = isEditing && announcement 
        ? `/api/announcements/${announcement.id}`
        : "/api/announcements";
      
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Reset form and close modal
        setTitle("");
        setContent("");
        onClose();
        // Refresh the page to show the new announcement
        window.location.reload();
      } else {
        alert(result.error || "Failed to save announcement");
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-basePrimaryLight rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-baseSecondary/10">
          <h2 className="text-xl font-semibold text-baseSecondary">
            {isEditing ? "Edit Announcement" : "Create New Announcement"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-baseSecondary/70 hover:text-baseSecondary hover:bg-baseSecondary/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-baseSecondary mb-2">
              Charity
            </label>
            <div className="bg-baseSecondary/5 p-3 rounded-lg">
              <span className="text-baseSecondary">{charityName}</span>
            </div>
          </div>

          <div>
            <label 
              htmlFor="title" 
              className="block text-sm font-medium text-baseSecondary mb-2"
            >
              Announcement Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-baseSecondary/20 rounded-lg focus:ring-2 focus:ring-basePrimary focus:border-basePrimary bg-white text-baseSecondary"
              placeholder="Enter announcement title..."
            />
            <div className="text-xs text-baseSecondary/60 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          <div>
            <label 
              htmlFor="content" 
              className="block text-sm font-medium text-baseSecondary mb-2"
            >
              Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              maxLength={2000}
              rows={8}
              className="w-full px-4 py-3 border border-baseSecondary/20 rounded-lg focus:ring-2 focus:ring-basePrimary focus:border-basePrimary bg-white text-baseSecondary resize-vertical"
              placeholder="Write your announcement content here..."
            />
            <div className="text-xs text-baseSecondary/60 mt-1">
              {content.length}/2000 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-baseSecondary/20 rounded-lg text-baseSecondary bg-transparent hover:bg-baseSecondary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 px-6 py-3 bg-basePrimary hover:bg-basePrimary/90 text-baseSecondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? "Saving..." 
                : isEditing 
                ? "Update Announcement" 
                : "Create Announcement"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};