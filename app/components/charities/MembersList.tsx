import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { CharityMembership } from "~/types/charities";
import { Modal } from "~/components/utils/Modal2";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { Trash, Warning, Check } from "@phosphor-icons/react";

type MembersListProps = {
  members: CharityMembership[];
  isAdmin: boolean;
  onMemberUpdate?: (updatedMember: CharityMembership) => void;
};

// Component for the member management modal
function MemberManageModal({
  isOpen,
  onClose,
  member,
  onRoleChange,
  onRemoveMember,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: CharityMembership | null;
  onRoleChange: (memberId: string, roles: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // Initialize selected roles when the modal opens with a member
  useEffect(() => {
    if (member) {
      setSelectedRoles(member.roles);
    }
  }, [member]);

  // Toggle role selection
  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  // Handle saving role changes
  const handleSaveRoles = async () => {
    if (!member) return;
    await onRoleChange(member.id, selectedRoles);
  };

  // Handle member removal
  const handleRemoveMember = async () => {
    if (!member) return;
    await onRemoveMember(member.id);
    setShowConfirmRemove(false);
  };

  // If no member is selected, don't render the modal content
  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        {showConfirmRemove ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-baseSecondary">
              Confirm Removal
            </h2>
            <div className="flex items-center gap-2 p-3 bg-dangerPrimary/10 text-dangerPrimary rounded-lg">
              <Warning size={20} />
              <p>
                Are you sure you want to remove {member.user.name} from this
                charity?
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <SecondaryButton
                text="Cancel"
                action={() => setShowConfirmRemove(false)}
                ariaLabel="Cancel member removal"
                disabled={isSubmitting}
              />
              <PrimaryButton
                text={isSubmitting ? "Processing..." : "Remove Member"}
                action={handleRemoveMember}
                ariaLabel="Confirm member removal"
                disabled={isSubmitting}
                className="bg-dangerPrimary hover:bg-dangerPrimary/90"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-baseSecondary">
              Manage Member
            </h2>
            <div className="bg-basePrimary/40 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-baseSecondary">
                {member.user.name}
              </h3>
              <p className="text-baseSecondary/70 text-sm">
                {member.user.email}
              </p>
              <p className="text-baseSecondary/70 text-sm mt-1">
                Joined: {format(new Date(member.joinedAt), "MMM d, yyyy")}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-baseSecondary mb-2">
                Member Roles
              </h3>
              <div className="space-y-2">
                <div
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedRoles.includes("admin")
                      ? "border-baseSecondary bg-basePrimary/40"
                      : "border-baseSecondary/20"
                  }`}
                  onClick={() => toggleRole("admin")}
                >
                  <div
                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("admin")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("admin") && (
                      <Check
                        weight="bold"
                        className="w-3 h-3 text-baseSecondary"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-baseSecondary">
                      Admin
                    </span>
                    <p className="text-xs text-baseSecondary/70">
                      Can manage charity settings, tasks, and members
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedRoles.includes("coordinator")
                      ? "border-baseSecondary bg-basePrimary/40"
                      : "border-baseSecondary/20"
                  }`}
                  onClick={() => toggleRole("coordinator")}
                >
                  <div
                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("coordinator")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("coordinator") && (
                      <Check
                        weight="bold"
                        className="w-3 h-3 text-baseSecondary"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-baseSecondary">
                      Coordinator
                    </span>
                    <p className="text-xs text-baseSecondary/70">
                      Can organize tasks and manage volunteers
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedRoles.includes("editor")
                      ? "border-baseSecondary bg-basePrimary/40"
                      : "border-baseSecondary/20"
                  }`}
                  onClick={() => toggleRole("editor")}
                >
                  <div
                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("editor")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("editor") && (
                      <Check
                        weight="bold"
                        className="w-3 h-3 text-baseSecondary"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-baseSecondary">
                      Editor
                    </span>
                    <p className="text-xs text-baseSecondary/70">
                      Can edit charity content and posts
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedRoles.includes("volunteer")
                      ? "border-baseSecondary bg-basePrimary/40"
                      : "border-baseSecondary/20"
                  }`}
                  onClick={() => toggleRole("volunteer")}
                >
                  <div
                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("volunteer")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("volunteer") && (
                      <Check
                        weight="bold"
                        className="w-3 h-3 text-baseSecondary"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-baseSecondary">
                      Volunteer
                    </span>
                    <p className="text-xs text-baseSecondary/70">
                      Can apply for and complete tasks
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedRoles.includes("supporter")
                      ? "border-baseSecondary bg-basePrimary/40"
                      : "border-baseSecondary/20"
                  }`}
                  onClick={() => toggleRole("supporter")}
                >
                  <div
                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("supporter")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("supporter") && (
                      <Check
                        weight="bold"
                        className="w-3 h-3 text-baseSecondary"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-baseSecondary">
                      Supporter
                    </span>
                    <p className="text-xs text-baseSecondary/70">
                      Follows charity activities and receives updates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap justify-between gap-4">
              <SecondaryButton
                text="Remove Member"
                action={() => setShowConfirmRemove(true)}
                ariaLabel="Remove member from charity"
                className="text-dangerPrimary border-dangerPrimary hover:bg-dangerPrimary/10"
              />

              <div className="flex gap-3">
                <SecondaryButton
                  text="Cancel"
                  action={onClose}
                  ariaLabel="Cancel member management"
                  disabled={isSubmitting}
                />
                <PrimaryButton
                  text={isSubmitting ? "Saving..." : "Save Changes"}
                  action={handleSaveRoles}
                  ariaLabel="Save role changes"
                  disabled={isSubmitting || selectedRoles.length === 0}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function MembersList({
  members: initialMembers,
  isAdmin,
  onMemberUpdate,
}: MembersListProps) {
  // Use a single source of truth for members
  const [members, setMembers] = useState<CharityMembership[]>(initialMembers);
  const [selectedMember, setSelectedMember] = useState<CharityMembership | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Track whether we have pending local changes to prevent prop overrides
  const [pendingChanges, setPendingChanges] = useState(false);

  // Use fetcher for API mutations
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  // Sync with parent component's members when props change
  useEffect(() => {
    // Only update from props if we don't have pending changes
    if (!pendingChanges) {
      setMembers(initialMembers);
    }
  }, [initialMembers, pendingChanges]);

  // Open management modal for a member
  const handleManageMember = (member: CharityMembership) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  // Generic function to handle member updates (both role changes and removal)
  const updateMemberState = (
    operation: 'update' | 'remove',
    memberId: string,
    updatedData?: Partial<CharityMembership>
  ) => {
    setPendingChanges(true);
    
    if (operation === 'update' && updatedData) {
      // Update the member in the local state
      const updatedMembers = members.map(member => 
        member.id === memberId 
          ? { ...member, ...updatedData }
          : member
      );
      setMembers(updatedMembers);
      
      // Find the updated member to pass to the parent
      const updatedMember = updatedMembers.find(m => m.id === memberId);
      if (updatedMember && onMemberUpdate) {
        onMemberUpdate(updatedMember);
      }
    } else if (operation === 'remove') {
      // Remove the member from local state
      setMembers(prevMembers => prevMembers.filter(m => m.id !== memberId));
    }
    
    // Close the modal
    setIsModalOpen(false);
  };

  // Handle role changes
  const handleRoleChange = async (memberId: string, roles: string[]) => {
    const memberToUpdate = members.find(m => m.id === memberId);
    if (!memberToUpdate) return;

    // Optimistically update the UI
    updateMemberState('update', memberId, { roles });

    // Submit the change to the server
    fetcher.submit(
      {
        action: "updateMember",
        memberId,
        roles: JSON.stringify(roles),
      },
      {
        method: "post",
        action: "/api/charity-membership",
        encType: "application/x-www-form-urlencoded",
        preventScrollReset: true,
        replace: true,
      }
    );
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Optimistically update the UI
    updateMemberState('remove', memberId);

    // Submit the removal to the server
    fetcher.submit(
      {
        action: "removeMember",
        userId: member.userId,
        charityId: member.charityId,
      },
      {
        method: "post",
        action: "/api/charity-membership",
        encType: "application/x-www-form-urlencoded",
        preventScrollReset: true,
        replace: true,
      }
    );
  };

  // Handle API responses
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        // On success, reset the pending changes flag
        setPendingChanges(false);
        
        // If there's updated membership data from the server, use it
        if (fetcher.data.membership) {
          const serverMember = fetcher.data.membership;
          setMembers(prev => 
            prev.map(member => 
              member.id === serverMember.id ? { ...member, ...serverMember } : member
            )
          );
          
          // Also notify parent component about the server-confirmed update
          if (onMemberUpdate) {
            onMemberUpdate(fetcher.data.membership);
          }
        }
      } else {
        // If there's an error, revert to initial data
        setMembers(initialMembers);
        setPendingChanges(false);
        alert(fetcher.data.message || "Operation failed. Please try again.");
      }
    }
  }, [fetcher.data, fetcher.state, initialMembers, onMemberUpdate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-baseSecondary mb-4">
        Charity Members
      </h2>

      {members.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-baseSecondary/70">
            No members found for this charity.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-baseSecondary/10">
          <table className="min-w-full divide-y divide-baseSecondary/10">
            <thead className="bg-basePrimary/60">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-baseSecondary/70 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-baseSecondary/70 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-baseSecondary/70 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-baseSecondary/70 uppercase tracking-wider"
                >
                  Joined
                </th>
                {isAdmin && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-baseSecondary/70 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-basePrimary/30 divide-y divide-baseSecondary/10">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-basePrimary/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-baseSecondary">
                      {member.user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-baseSecondary/80">
                      {member.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${role === "admin" ? "bg-confirmPrimary/20 text-confirmPrimary" : "bg-baseSecondary/10 text-baseSecondary"}`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-baseSecondary/80">
                    {format(new Date(member.joinedAt), "MMM d, yyyy")}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        className="text-baseSecondary bg-baseSecondary/20 px-2 rounded-lg py-1 hover:text-accentPrimary/50 font-medium"
                        onClick={() => handleManageMember(member)}
                      >
                        Manage
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Management Modal */}
      <MemberManageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedMember}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
