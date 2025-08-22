import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { User, Calendar, Pencil, Trash } from "@phosphor-icons/react";

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      name: string;
    };
    charityId: string;
  };
  canEdit?: boolean;
  onEdit?: (announcement: any) => void;
  onDelete?: (announcementId: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  canEdit = false,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = confirm("Are you sure you want to delete this announcement?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(announcement.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(announcement);
    }
  };

  return (
    <div className="bg-basePrimaryLight rounded-xl shadow-sm border border-baseSecondary/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-baseSecondary/10">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-baseSecondary">
            {announcement.title}
          </h3>
          {canEdit && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleEdit}
                className="p-2 text-baseSecondary/70 hover:text-baseSecondary hover:bg-baseSecondary/10 rounded-lg transition-colors"
                title="Edit announcement"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-dangerPrimary/70 hover:text-dangerPrimary hover:bg-dangerPrimary/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete announcement"
              >
                <Trash size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <p className="text-baseSecondary/90 whitespace-pre-wrap leading-relaxed">
          {announcement.content}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-baseSecondary/5 border-t border-baseSecondary/10">
        <div className="flex flex-wrap gap-4 text-sm text-baseSecondary/70">
          <div className="flex items-center gap-1">
            <User size={14} />
            <span>{announcement.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span title={format(new Date(announcement.createdAt), "PPpp")}>
              {formatDistanceToNow(new Date(announcement.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          {announcement.updatedAt !== announcement.createdAt && (
            <span className="text-xs text-baseSecondary/50">
              (edited {formatDistanceToNow(new Date(announcement.updatedAt), {
                addSuffix: true,
              })})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};