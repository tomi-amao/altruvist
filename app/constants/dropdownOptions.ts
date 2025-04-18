export const sortOptionsConstant = [
  {
    id: 1,
    option: "date",
  },
  {
    id: 2,
    option: "sender",
  },
];

export const filterOptionsConstant = [
  {
    id: 1,
    option: "Pipeline",
  },
  {
    id: 2,
    option: "Network",
  },
];

export const taskSortOptions = [
  {
    id: 1,
    option: "Date",
  },
  {
    id: 2,
    option: "Deadline",
  },
];

export const urgencyOptions = ["LOW", "MEDIUM", "HIGH"];
export const statusOptions = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];
export const applicationStatusOptions = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

export const charityCategories = [
  // Health and Medical
  "Healthcare",
  "Medical Research",
  "Mental Health",
  "Disability Support",
  "Disease Prevention",
  "Hospice Care",
  "Children's Health",

  // Environmental and Conservation
  "Environmental Conservation",
  "Wildlife Protection",
  "Sustainability",
  "Climate Action",
  "Ocean Conservation",
  "Forest Preservation",
  "Clean Energy",

  // Education and Learning
  "Education",
  "Adult Education",
  "Youth Programs",
  "Literacy",
  "STEM Education",
  "Scholarships",
  "School Supplies",

  // Poverty and Hunger Relief
  "Poverty Alleviation",
  "Homelessness",
  "Food Banks",
  "Disaster Relief",
  "Refugee Support",
  "Hunger Relief",
  "Shelter",

  // Animal Welfare
  "Animal Rights",
  "Animal Shelters",
  "Pet Adoption",
  "Veterinary Services",
  "Animal Rescue",
  "Wildlife Rehabilitation",

  // Human Rights and Advocacy
  "Human Rights",
  "Women's Rights",
  "LGBTQ+ Advocacy",
  "Racial Equality",
  "Social Justice",
  "Anti-Human Trafficking",
  "Immigrant Support",

  // Arts and Culture
  "Performing Arts",
  "Cultural Preservation",
  "Museums",
  "Public Libraries",
  "Community Arts",
  "Theater",
  "Music Education",

  // Community Development
  "Community Development",
  "Local Charities",
  "Economic Empowerment",
  "Housing",
  "Job Training",
  "Youth Development",
  "Public Safety",

  // International Aid
  "International Development",
  "Global Health",
  "Clean Water Access",
  "Sanitation",
  "Hunger Relief",
  "Microfinance",
  "Humanitarian Aid",

  // Veterans and Military
  "Veteran Support",
  "Military Families",
  "Wounded Warriors",
  "Rehabilitation Services",
  "Veterans' Education",
  "Military Transition Programs",

  // Children and Youth
  "Child Protection",
  "Orphanages",
  "Foster Care",
  "Youth Mentoring",
  "Child Advocacy",
  "Education for Children",

  // Senior Support
  "Senior Care",
  "Elderly Support",
  "Alzheimer's Research",
  "Aging Services",
  "Retirement Support",

  // Faith-Based Charities
  "Faith-Based",
  "Religious Organizations",
  "Missionary Work",
  "Church Outreach",
  "Faith-Based Education",

  // Sports and Recreation
  "Sports for Youth",
  "Disabled Sports",
  "Recreational Programs",
  "Physical Education",
  "Youth Sports Leagues",

  // Technology and Innovation
  "Tech for Good",
  "Access to Technology",
  "Digital Literacy",
  "Open Source Projects",
  "Tech Education",
  "Internet Access",

  // Miscellaneous
  "Public Policy",
  "Legal Aid",
  "Disaster Preparedness",
  "Crisis Intervention",
  "Addiction Support",
  "Mental Health Awareness",
  "Volunteerism",
];

export const locationTypeOptions = ["REMOTE", "ONSITE"];

export const volunteeringSkills = [
  // Interpersonal & Communication
  "Mentoring & Teaching",

  // Administrative & Organizational
  "Data Entry & Filing",
  "Event & Volunteer Coordination",
  "Project Management",

  // Community & Field Service
  "Cleaning & Sanitizing",
  "Construction & Repairs",
  "Cooking & Meal Delivery",
  "Disaster & Crisis Response",
  "Gardening & Landscaping",
  "Shelter & Food Support",

  // Health & Wellness
  "CPR & First Aid",
  "Elderly & Personal Care",
  "Mental Health Support",

  // Education & Literacy
  "Tutoring & Reading Support",
  "Curriculum & Special Education",
  "ESL & Language Translation",
  "Library & Research Support",
  "STEM Instruction",

  // Creative & Media
  "Art & Music Instruction",
  "Content & Social Media",
  "Graphic & Web Design",
  "Photography & Video",
  "Writing & Editing",

  // Technical & Practical Skills
  "Carpentry & Plumbing",
  "Driving & Vehicle Maintenance",
  "Electrical & Mechanical Work",
  "Sewing & Painting",
  "Equipment Operation",

  // Fundraising & Outreach
  "Donor & Public Relations",
  "Fundraising & Grant Writing",
  "Marketing & Sales",
  "Newsletter & Outreach",

  // Animal Care
  "Animal Handling & Grooming",
  "Dog Walking & Pet Socialization",
  "Habitat & Wildlife Support",

  // Environmental
  "Conservation & Sustainability",
  "Environmental Education",
  "Recycling & Waste Reduction",
  "Trail & Habitat Maintenance",

  //software development
  "Software Development",
  "Web & Mobile Development",
  "Data Analysis & Visualization",
  "Cybersecurity & IT Support",
  "Cloud Computing & DevOps",
  "Research & Development",
];

export const getTags = (type: string) => {
  switch (type) {
    case "charityCategories":
      return charityCategories;
    case "volunteeringSkills":
      return volunteeringSkills;
    default:
      return [];
  }
};
export const getTaskStatusColor = (status: string) => {
  switch (status) {
    case "REJECTED":
      return "text-basePrimary bg-dangerPrimary";
    case "PENDING":
      return "text-baseSecondary bg-accentPrimary ";
    case "ACCEPTED":
      return "  bg-confirmPrimary text-basePrimaryLight";
    default:
      return "text-baseSecondary bg-basePrimaryLight";
  }
};
