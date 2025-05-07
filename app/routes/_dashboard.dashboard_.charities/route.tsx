import {
  MetaFunction,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";

// Import our components
import { CharityList } from "~/components/charities/CharityList";
import { CharityDetails } from "~/components/charities/CharityDetails";
import { ApplicationsList } from "~/components/charities/ApplicationsList";
import { ApplicationReviewModal } from "~/components/charities/ApplicationReviewModal";
import { MembersList } from "~/components/charities/MembersList";

// Import types
import {
  type Charity,
  type CharityApplication,
  type CharityMembership,
  type CharityTask,
} from "~/types/charities";
import CharityForm from "~/components/charities/CharityForm";

// Import loader and action
import { loader } from "./loader";
import { action } from "./action";

// Define task interface

// Define charity form data interface
interface CharityFormData {
  name: string;
  description: string;
  mission?: string;
  backgroundPicture?: string | null;
  website?: string;
  socialMedia?: Record<string, string>;
  location?: string;
  [key: string]: unknown;
}

export { loader, action };

export const meta: MetaFunction = () => {
  return [
    { title: "Manage Charities" },
    { name: "description", content: "Manage your charities on Altruvist!" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export default function ManageCharities() {
  const {
    adminCharities,
    charities: initialCharities,
    pendingApplications,
    userApplications,
    COMPANION_URL,
    userRole,
    userCharities,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const { isMobile } = useViewport();
  const [searchParams] = useSearchParams();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(
    () => searchParams.get("charityid") || null,
  );
  const [isDetailsView, setIsDetailsView] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "applications" | "members" | "tasks"
  >("details");

  // Application modal state
  const [selectedApplication, setSelectedApplication] =
    useState<CharityApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Resource states with loading indicators
  const [signedBackgroundUrl, setSignedBackgroundUrl] = useState<
    string | undefined
  >(undefined);
  const [charityTasks, setCharityTasks] = useState<CharityTask[]>([]);
  const [charityMembers, setCharityMembers] = useState<CharityMembership[]>([]);

  // Loading states consolidated
  const [isLoading, setIsLoading] = useState({
    charity: false,
    tasks: false,
    members: false,
    initialLoaded: false,
  });

  // Combined loading state for UI
  const isPageLoading =
    !isLoading.initialLoaded &&
    (isLoading.charity || isLoading.tasks || isLoading.members);

  // Handle URL updates
  useEffect(() => {
    const charityId = searchParams.get("charityid");
    if (charityId) {
      setSelectedCharityId(charityId);
      navigate("/dashboard/charities", { replace: true });
    }
  }, [searchParams, navigate]);

  // Find selected charity from charities array
  const selectedCharity = useMemo(
    () =>
      selectedCharityId
        ? initialCharities.find((c) => c.id === selectedCharityId)
        : null,
    [initialCharities, selectedCharityId],
  );

  // Fetch required data when charity selection changes
  useEffect(() => {
    if (!selectedCharityId) {
      setSignedBackgroundUrl(undefined);
      setCharityTasks([]);
      setCharityMembers([]);
      return;
    }

    const fetchCharityData = async () => {
      // Track loading states
      setIsLoading((prev) => ({
        ...prev,
        charity: !!selectedCharity?.backgroundPicture,
        tasks: true,
        members: true,
      }));

      // Fetch tasks and members in parallel
      const [tasksPromise, membersPromise] = [
        fetch(`/api/charities/${selectedCharityId}/tasks`),
        fetch(`/api/charities/${selectedCharityId}/members`),
      ];

      // Fetch background URL if exists
      if (selectedCharity?.backgroundPicture) {
        try {
          const response = await fetch(
            `/api/s3-get-url?key=${encodeURIComponent(selectedCharity.backgroundPicture)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setSignedBackgroundUrl(data.url);
          } else {
            console.error("Failed to get signed URL");
            setSignedBackgroundUrl(undefined);
          }
        } catch (error) {
          console.error("Error fetching signed URL:", error);
          setSignedBackgroundUrl(undefined);
        } finally {
          setIsLoading((prev) => ({ ...prev, charity: false }));
        }
      } else {
        setSignedBackgroundUrl(undefined);
        setIsLoading((prev) => ({ ...prev, charity: false }));
      }

      // Process tasks response
      try {
        const tasksResponse = await tasksPromise;
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setCharityTasks(data.tasks || []);
        } else {
          setCharityTasks([]);
        }
      } catch (error) {
        console.error("Error fetching charity tasks:", error);
        setCharityTasks([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, tasks: false }));
      }

      // Process members response
      try {
        const membersResponse = await membersPromise;
        if (membersResponse.ok) {
          const data = await membersResponse.json();
          setCharityMembers(data.members || []);
        } else {
          setCharityMembers([]);
        }
      } catch (error) {
        console.error("Error fetching charity members:", error);
        setCharityMembers([]);
      } finally {
        setIsLoading((prev) => ({
          ...prev,
          members: false,
          initialLoaded: true,
        }));
      }
    };

    fetchCharityData();
  }, [selectedCharityId, selectedCharity]);

  // Filter applications for selected charity
  const filteredApplications = useMemo(
    () =>
      selectedCharityId
        ? pendingApplications.filter(
            (app) => app.charityId === selectedCharityId,
          )
        : [],
    [pendingApplications, selectedCharityId],
  );

  // Handle charity selection
  const handleCharitySelect = (charity: Charity) => {
    setSelectedCharityId(charity.id);
    setIsEditing(false);
    setActiveTab("details");
    setIsLoading((prev) => ({ ...prev, initialLoaded: false }));

    if (isMobile) {
      setIsDetailsView(true);
    }
  };

  // Handle charity deletion
  const handleDeleteCharity = (charityId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this charity? This action cannot be undone.",
      )
    ) {
      fetcher.submit(
        { _action: "deleteCharity", charityId },
        { method: "POST" },
      );
      setSelectedCharityId(null);
    }
  };

  // Handle charity create/update
  const handleCharityFormSubmit = (formData: CharityFormData) => {
    if (isEditing && selectedCharity) {
      fetcher.submit(
        {
          _action: "updateCharity",
          charityId: selectedCharity.id,
          charityData: JSON.stringify(formData),
        },
        { method: "POST" },
      );
      setIsEditing(false);
    }
  };

  // Handle member update
  const handleMemberUpdate = (updatedMember: CharityMembership) => {
    setCharityMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === updatedMember.id ? updatedMember : member,
      ),
    );
  };

  // Application review handlers
  const handleReviewApplication = (
    applicationWithDecision: CharityApplication & {
      decision: string;
      reviewNote?: string;
    },
  ) => {
    if (!applicationWithDecision.decision) return;

    fetcher.submit(
      {
        _action: "reviewApplication",
        applicationId: applicationWithDecision.id,
        status: applicationWithDecision.decision,
        reviewNote: applicationWithDecision.reviewNote || undefined,
      },
      {
        method: "POST",
        replace: true,
        preventScrollReset: true,
      },
    );
  };

  const handleOpenApplication = (application: CharityApplication) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleSubmitReview = (
    decision: "ACCEPTED" | "REJECTED",
    reviewNote: string,
  ) => {
    if (!selectedApplication) return;

    fetcher.submit(
      {
        _action: "reviewApplication",
        applicationId: selectedApplication.id,
        status: decision,
        reviewNote: reviewNote || undefined,
      },
      {
        method: "POST",
        replace: true,
        preventScrollReset: true,
      },
    );

    setShowApplicationModal(false);
  };

  // Check if user is admin of selected charity
  const isAdminOfSelectedCharity = useMemo(
    () =>
      selectedCharityId
        ? adminCharities.some((charity) => charity.id === selectedCharityId)
        : false,
    [selectedCharityId, adminCharities],
  );

  return (
    <div className="flex flex-col lg:flex-row w-full lg:min-h-screen p-4 -mt-8 gap-6">
      <AnimatePresence mode="wait">
        {!isDetailsView && (
          <motion.div
            className="lg:w-1/3 w-full p-4 space-y-4 rounded-md border border-basePrimaryDark overflow-auto"
            initial={{ opacity: 0, x: isMobile ? -40 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key="charity-list"
          >
            <CharityList
              charities={initialCharities}
              selectedCharityId={selectedCharityId}
              onCharitySelect={handleCharitySelect}
              adminCharities={adminCharities}
              pendingApplications={pendingApplications}
              userApplications={userApplications}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              userCharities={userCharities}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          className="lg:w-2/3 w-full pt-4 lg:pt-0 lg:pl-6 flex flex-col"
          initial={{ opacity: 0, x: isMobile ? 40 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          key={isDetailsView ? "charity-detail-view" : "charity-detail-default"}
        >
          {isDetailsView && isMobile && (
            <motion.button
              className="flex items-center space-x-2 text-baseSecondary mb-4 p-2 hover:bg-basePrimaryLight rounded-lg transition-colors"
              onClick={() => setIsDetailsView(false)}
              aria-label="Go back to charity list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} />
              <span>Back to charities</span>
            </motion.button>
          )}

          {selectedCharity ? (
            isEditing ? (
              <div className="flex flex-col h-full lg:max-w-7xl w-full m-auto">
                <CharityForm
                  onSubmit={handleCharityFormSubmit}
                  onCancel={() => setIsEditing(false)}
                  initialData={selectedCharity}
                  isSubmitting={fetcher.state === "submitting"}
                  isEditing={true}
                  COMPANION_URL={COMPANION_URL}
                />
              </div>
            ) : isPageLoading ? (
              <div className="flex flex-col h-full lg:max-w-7xl w-full m-auto">
                <div className="rounded-xl shadow-sm overflow-hidden flex-grow flex items-center justify-center p-12">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-baseSecondary/30 border-t-baseSecondary rounded-full animate-spin mb-4"></div>
                    <p className="text-baseSecondary/80">
                      Loading charity details...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full lg:max-w-7xl w-full m-auto">
                <div className="flex-shrink-0">
                  <CharityDetails
                    charity={selectedCharity}
                    isAdmin={isAdminOfSelectedCharity}
                    onEdit={() => setIsEditing(true)}
                    onDelete={handleDeleteCharity}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    pendingApplicationsCount={filteredApplications.length}
                    signedBackgroundUrl={signedBackgroundUrl}
                    charityTasks={charityTasks}
                    onTaskSelect={(task) => {
                      navigate(
                        userRole[0] === "charity"
                          ? `/dashboard/tasks?taskid=${task.id}`
                          : `/task/${task.id}`,
                      );
                    }}
                  />
                </div>

                {/* Tab content */}
                {activeTab === "applications" && isAdminOfSelectedCharity && (
                  <div className="bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden flex-grow">
                    <div className="p-6">
                      <ApplicationsList
                        applications={filteredApplications}
                        onReviewApplication={handleReviewApplication}
                        onOpenApplication={handleOpenApplication}
                        isSubmitting={fetcher.state === "submitting"}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "members" && (
                  <div className="bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden flex-grow">
                    <MembersList
                      members={charityMembers}
                      isAdmin={isAdminOfSelectedCharity}
                      onMemberUpdate={handleMemberUpdate}
                    />
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-baseSecondary p-8 rounded-xl">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">
                  {initialCharities.length > 0
                    ? "Select a charity to view details"
                    : "No charities found"}
                </h3>
                <p className="text-baseSecondary/70 mb-4">
                  {initialCharities.length > 0
                    ? "Choose a charity from the list to see its details"
                    : adminCharities.length > 0
                      ? "Create a new charity to get started"
                      : "Join a charity to see it in this list"}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Application Review Modal */}
      <ApplicationReviewModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        selectedApplication={selectedApplication}
        onSubmitReview={handleSubmitReview}
        isSubmitting={fetcher.state === "submitting"}
      />
    </div>
  );
}
