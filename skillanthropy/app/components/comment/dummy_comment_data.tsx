// Sample users for our comments
const users = [
  {
    id: "user1",
    name: "Sarah Chen",
    avatar: "/api/placeholder/32/32", // Replace with actual avatar URL
  },
  {
    id: "user2",
    name: "Marcus Rodriguez",
    avatar: "/api/placeholder/32/32",
  },
  {
    id: "user3",
    name: "Alex Thompson",
    avatar: "/api/placeholder/32/32",
  },
  {
    id: "user4",
    name: "Priya Patel",
    avatar: "/api/placeholder/32/32",
  },
  {
    id: "user5",
    name: "Jordan Lee",
    avatar: "/api/placeholder/32/32",
  },
];

// Generate timestamps within the last week
const getRandomRecentDate = () => {
  const now = new Date();
  const randomMinutes = Math.floor(Math.random() * 7 * 24 * 60); // Random minutes within last week
  return new Date(now.getTime() - randomMinutes * 60000);
};

// Sample comments data
export const dummyComments = [
  {
    id: "comment1",
    content:
      "I've worked on similar projects before and would be happy to share some insights about the most effective approaches we used. The key is to break down the deliverables into manageable chunks.",
    createdAt: getRandomRecentDate(),
    updatedAt: getRandomRecentDate(),
    user: users[0],
    replies: [
      {
        id: "reply1",
        content:
          "That's really helpful Sarah! Could you elaborate on how you structured the deliverables in your previous projects?",
        createdAt: getRandomRecentDate(),
        updatedAt: getRandomRecentDate(),
        user: users[3],
        parentId: "comment1",
        replies: [
          {
            id: "reply1_1",
            content:
              "Of course! We used a sprint-based approach with 2-week iterations. Each sprint focused on one key deliverable, which helped keep the team aligned and made progress more visible.",
            createdAt: getRandomRecentDate(),
            updatedAt: getRandomRecentDate(),
            user: users[0],
            parentId: "reply1",
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "comment2",
    content:
      "The timeline seems quite ambitious. Have we considered adding some buffer time for unexpected challenges? In my experience with similar projects, it's better to be conservative with initial estimates.",
    createdAt: getRandomRecentDate(),
    updatedAt: getRandomRecentDate(),
    user: users[1],
    replies: [
      {
        id: "reply2",
        content:
          "Good point about the timeline. We could potentially adjust the scope of phase 2 to ensure we meet the deadline without compromising quality.",
        createdAt: getRandomRecentDate(),
        updatedAt: getRandomRecentDate(),
        user: users[2],
        parentId: "comment2",
        replies: [],
      },
    ],
  },
  {
    id: "comment3",
    content:
      "I've reviewed the requirements and noticed we might need additional expertise in data visualization. I have experience with D3.js and could help with that aspect of the project.",
    createdAt: getRandomRecentDate(),
    updatedAt: getRandomRecentDate(),
    user: users[4],
    replies: [],
  },
  {
    id: "comment4",
    content:
      "Has anyone started working on the initial setup? I could begin with the basic infrastructure setup if needed.",
    createdAt: getRandomRecentDate(),
    updatedAt: getRandomRecentDate(),
    user: users[2],
    replies: [
      {
        id: "reply3",
        content:
          "I haven't started yet, but I've documented some initial thoughts on the architecture. Would you like me to share them?",
        createdAt: getRandomRecentDate(),
        updatedAt: getRandomRecentDate(),
        user: users[3],
        parentId: "comment4",
        replies: [],
      },
    ],
  },
  {
    id: "comment5",
    content:
      "Just wanted to confirm - are we using the latest version of the framework for this project? There are some great new features in the latest release that could be beneficial.",
    createdAt: getRandomRecentDate(),
    updatedAt: getRandomRecentDate(),
    user: users[1],
    replies: [],
  },
];

// Function to get comments for a specific task
export const getCommentsForTask = (taskId: string) => {
  // In a real implementation, this would filter comments by taskId
  // For now, we'll just return all dummy comments
  return dummyComments;
};

// Function to get a specific user
export const getUser = (userId: string) => {
  return users.find((user) => user.id === userId) || users[0];
};

// Helper function to get a random user (for testing)
export const getRandomUser = () => {
  return users[Math.floor(Math.random() * users.length)];
};
