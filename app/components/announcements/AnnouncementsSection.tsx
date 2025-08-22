import React, { useState, useEffect } from "react";
import { Plus, Megaphone } from "@phosphor-icons/react";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementForm } from "./AnnouncementForm";

interface AnnouncementsSectionProps {
  charityId: string;
  charityName: string;
  canManageAnnouncements: boolean;
  userInfo?: {
    id: string;
    name: string;
  };
}

interface Announcement {
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
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({
  charityId,
  charityName,
  canManageAnnouncements,
  userInfo,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/announcements?charityId=${charityId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnnouncements(data.announcements || []);
      } else {
        console.error("Failed to fetch announcements:", data.error);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [charityId]);

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAnnouncements(announcements.filter(a => a.id !== announcementId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete announcement");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    // Refetch announcements after form is closed
    fetchAnnouncements();
  };

  const canEditAnnouncement = (announcement: Announcement) => {
    return canManageAnnouncements || (userInfo && announcement.author.id === userInfo.id);
  };

  if (isLoading) {
    return (
      <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-baseSecondary/10">
          <h2 className="text-xl font-semibold text-baseSecondary">Announcements</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-baseSecondary/70">Loading announcements...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-baseSecondary/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Megaphone size={20} className="text-baseSecondary" />
              <h2 className="text-xl font-semibold text-baseSecondary">Announcements</h2>
            </div>
            {canManageAnnouncements && (
              <button
                onClick={handleCreateAnnouncement}
                className="flex items-center gap-2 px-4 py-2 bg-basePrimary hover:bg-basePrimary/90 text-baseSecondary rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>New Announcement</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone size={48} className="text-baseSecondary/30 mx-auto mb-4" />
              <p className="text-baseSecondary/70 mb-4">
                No announcements yet from this charity.
              </p>
              {canManageAnnouncements && (
                <button
                  onClick={handleCreateAnnouncement}
                  className="px-6 py-2 bg-basePrimary hover:bg-basePrimary/90 text-baseSecondary rounded-lg transition-colors"
                >
                  Create First Announcement
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  canEdit={canEditAnnouncement(announcement)}
                  onEdit={handleEditAnnouncement}
                  onDelete={handleDeleteAnnouncement}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcement Form Modal */}
      <AnnouncementForm
        isOpen={showForm}
        onClose={handleCloseForm}
        charityId={charityId}
        charityName={charityName}
        announcement={editingAnnouncement ? {
          id: editingAnnouncement.id,
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
        } : undefined}
        isEditing={!!editingAnnouncement}
      />
    </>
  );
};