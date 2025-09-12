import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Tag,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

// Type definitions
interface FormData {
  name: string;
  deployedLink: string;
  description: string;
  linkedinPostUrl: string;
  twitterPostUrl: string;
  tags: string;
}

interface AIInsights {
  category: string;
  techStack: string[];
  complexity: string;
  marketability: string;
}

interface SubmitResponse {
  success: boolean;
  data?: {
    id: number;
    name: string;
    deployedLink: string;
    description: string;
    shareableLink: string;
    likes: number;
    userId: number;
    createdAt: string;
  };
  error?: string;
}

interface SubmitStatus {
  type: "success" | "error";
  message: string;
  shareableLink?: string;
  insights?: AIInsights;
  projectId?: number;
}

const HackathonShowcase: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    deployedLink: "",
    description: "",
    linkedinPostUrl: "",
    twitterPostUrl: "",
    tags: "",
  });
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [userPostCount, setUserPostCount] = useState<number>(0);
  const [canCreateMore, setCanCreateMore] = useState<boolean>(true);

  const [projectId, setProjectId] = useState<number>();
  // Fallback tags in case API fails - must match backend format
  const fallbackTags = [
    "web-development",
    "mobile-development", 
    "ai-ml",
    "blockchain",
    "game-development",
    "data-science",
    "devtools",
    "productivity",
    "social",
    "education",
    "health-fitness",
    "finance",
    "entertainment",
    "other"
  ];

  // Function to convert backend tag format to display format
  const formatTagForDisplay = (tag: string): string => {
    const tagMap: Record<string, string> = {
      "web-development": "Web Development",
      "mobile-development": "Mobile Development",
      "ai-ml": "AI/ML",
      "blockchain": "Blockchain",
      "game-development": "Game Development",
      "data-science": "Data Science",
      "devtools": "Developer Tool",
      "productivity": "Productivity",
      "social": "Social",
      "education": "Education",
      "health-fitness": "Health & Fitness",
      "finance": "Finance",
      "entertainment": "Entertainment",
      "other": "Other"
    };
    return tagMap[tag] || tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Fetch available tags
  const fetchTags = async (): Promise<void> => {
    try {
      console.log(
        "Fetching tags from:",
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/tags`
      );
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/tags`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tags API response:", data);

      if (data.success && Array.isArray(data.data)) {
        setAvailableTags(data.data);
        console.log("Tags loaded successfully:", data.data);
      } else {
        console.log("Invalid tags response, using fallback");
        setAvailableTags(fallbackTags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      console.log("Using fallback tags due to error");
      setAvailableTags(fallbackTags);
    }
  };

  // Fetch user post count
  const fetchUserPostCount = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/user/my-posts?clerkId=${
          user.id
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUserPostCount(data.meta.count);
        setCanCreateMore(data.meta.canCreateMore);
      }
    } catch (error) {
      console.error("Error fetching user post count:", error);
    }
  };

  // Load initial data
  useEffect(() => {
    // Always fetch tags regardless of user state
    fetchTags();
  }, []);

  // Fetch user-specific data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserPostCount();
    }
  }, [user?.id]);

  // Debug: log when tags change
  useEffect(() => {
    console.log("Available tags updated:", availableTags);
  }, [availableTags]);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleTagSelect = (tag: string): void => {
    setFormData((prev) => ({
      ...prev,
      tags: tag
    }));

    // Clear previous status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };
  console.log(projectId);
  // Real backend integration
  const submitToBackend = async (
    projectData: FormData
  ): Promise<SubmitResponse> => {
    try {
      const token = await getToken();
      const submissionPayload = {
        name: projectData.name.trim(),
        deployedLink: projectData.deployedLink.trim(),
        description: projectData.description.trim(),
        linkedinPostUrl: projectData.linkedinPostUrl.trim() || undefined,
        twitterPostUrl: projectData.twitterPostUrl.trim() || undefined,
        tags: projectData.tags || "other", // Send single tag as backend expects
        clerkId: user?.id,
      };
      console.log(projectId);
      console.log(token, "this is the token we are passing ");
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionPayload),
        }
      );

      const data: SubmitResponse = await response.json();
      console.log(data, "this is the data ");
      setProjectId(data?.data?.id);
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      console.log(projectId);
      return data;
    } catch (error) {
      console.error("Failed to submit project:", error);
      throw error;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    // Check if user can create more posts
    if (!canCreateMore) {
      setSubmitStatus({
        type: "error",
        message: `You have reached the maximum limit of 2 posts. You currently have ${userPostCount} posts.`,
      });
      return;
    }

    // Client-side validation
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Project name is required");
    }

    if (!formData.deployedLink.trim()) {
      errors.push("Deployed link is required");
    } else {
      try {
        const url = new URL(formData.deployedLink);
        if (!url.hostname.endsWith('.codepup.app')) {
          errors.push("Deployment URL must use a .codepup.app domain (e.g., https://yourproject.codepup.app/)");
        }
      } catch {
        errors.push("Please enter a valid URL for the deployed link");
      }
    }

    if (!formData.description.trim()) {
      errors.push("Project description is required");
    } else if (formData.description.trim().length < 20) {
      errors.push("Project description must be at least 20 characters long");
    }

    if (!formData.tags) {
      errors.push("Please select a tag for your project");
    }

    // Validate LinkedIn URL if provided
    if (
      formData.linkedinPostUrl.trim() &&
      !formData.linkedinPostUrl.includes("linkedin.com")
    ) {
      errors.push("LinkedIn URL must be a valid LinkedIn link");
    }

    // Validate Twitter URL if provided
    if (
      formData.twitterPostUrl.trim() &&
      !formData.twitterPostUrl.includes("twitter.com") &&
      !formData.twitterPostUrl.includes("x.com")
    ) {
      errors.push("Twitter URL must be a valid Twitter/X link");
    }

    if (errors.length > 0) {
      setSubmitStatus({
        type: "error",
        message: errors.join(". "),
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Generate shareable link (you might want to let backend handle this)

      const response = await submitToBackend(formData);

      if (response.success && response.data) {
        // Generate shareable URL for the submit status
        const shareableUrl = `${window.location.origin}/project/${response.data.id}`;
        
        setSubmitStatus({
          type: "success",
          message: "Project submitted successfully!",
          shareableLink: shareableUrl,
          projectId: response.data.id,
          // Mock AI insights since your backend doesn't return them yet
          insights: {
            category: "Web Application",
            techStack: ["React", "TypeScript", "Tailwind CSS"],
            complexity: "Intermediate",
            marketability: "High",
          },
        });

        // Reset form after successful submission
        setFormData({
          name: "",
          deployedLink: "",
          description: "",
          linkedinPostUrl: "",
          twitterPostUrl: "",
          tags: "",
        });

        // Refresh user post count
        fetchUserPostCount();
      } else {
        setSubmitStatus({
          type: "error",
          message: response.error || "Submission failed. Please try again.",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Network error. Please check your connection and try again.";

      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-lg"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Submit Your Project
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Share your <span className="font-semibold text-indigo-600">innovation</span> with the world
          </p>

          {/* Compact User Post Count */}
          {user && (
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/30">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    canCreateMore 
                      ? "bg-emerald-500" 
                      : "bg-amber-500"
                  }`}
                ></div>
                <span className="text-sm font-bold text-gray-800">
                  {userPostCount}/2 projects
                </span>
                {canCreateMore && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {2 - userPostCount} remaining
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compact Main Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 max-w-2xl mx-auto">
          <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-8">
              {/* Compact Project Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="Enter your project name"
                  maxLength={100}
                  required
                />
              </div>

              {/* Compact Deployed Link */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deployed Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="deployedLink"
                  name="deployedLink"
                  value={formData.deployedLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="https://yourproject.codepup.app/"
                  required
                />
                <p className="text-xs text-emerald-600 mt-2 flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                  Must use a .codepup.app domain
                </p>
              </div>

              {/* Compact Project Description */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                  placeholder="Describe your project, its features, technologies used, and what problem it solves..."
                  maxLength={1000}
                  required
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 20 characters required</span>
                  <span className={formData.description.length > 900 ? 'text-amber-600' : ''}>
                    {formData.description.length}/1000
                  </span>
                </div>
              </div>

              {/* Project Category */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Project Category <span className="text-red-500">*</span>
                </label>
                
                {/* Selected category indicator */}
                {!formData.tags && (
                  <div className="mb-3 text-gray-500 text-sm">
                    No category selected
                  </div>
                )}

                {/* Available categories in dark rounded button style */}
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = formData.tags === tag;
                    
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagSelect(isSelected ? "" : tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                        }`}
                      >
                        {formatTagForDisplay(tag)}
                      </button>
                    );
                  })}
                </div>
                
                {availableTags.length === 0 && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <span className="text-gray-500 text-sm">Loading categories...</span>
                  </div>
                )}
              </div>

              {/* Compact Social Media Links Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Social Media Links <span className="text-gray-500 font-normal">(Optional)</span></h3>

                <div className="space-y-4">
                  {/* Compact LinkedIn Post URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      LinkedIn Post URL
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600" />
                      <input
                        type="url"
                        id="linkedinPostUrl"
                        name="linkedinPostUrl"
                        value={formData.linkedinPostUrl}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                        placeholder="https://linkedin.com/posts/..."
                      />
                    </div>
                  </div>

                  {/* Compact Twitter Post URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Twitter/X Post URL
                    </label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sky-500" />
                      <input
                        type="url"
                        id="twitterPostUrl"
                        name="twitterPostUrl"
                        value={formData.twitterPostUrl}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                        placeholder="https://twitter.com/... or https://x.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Codepup Social Handles Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-indigo-600" />
                  Tag us on our socials!
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Don't forget to tag us when you share your project on social media
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://x.com/Codepupai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Twitter className="w-3 h-3 mr-2" />
                    @Codepupai
                  </a>
                  <a
                    href="https://www.linkedin.com/company/codepup/about/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Linkedin className="w-3 h-3 mr-2" />
                    Codepup
                  </a>
                </div>
              </div>

              {/* Compact Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !canCreateMore}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    !canCreateMore
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : isSubmitting
                      ? "bg-indigo-500 cursor-not-allowed text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105"
                  }`}
                >
                  {!canCreateMore ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Project Limit Reached (2/2)</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>

        {/* Modern Status Messages */}
        {submitStatus && (
          <div className={`mt-8 transform animate-in slide-in-from-bottom-4 duration-500 ${
            submitStatus.type === "success" ? "animate-pulse" : ""
          }`}>
            <div
              className={`p-8 rounded-3xl backdrop-blur-xl border shadow-2xl ${
                submitStatus.type === "success"
                  ? "bg-gradient-to-r from-emerald-50/80 to-green-50/80 border-emerald-200/50"
                  : "bg-gradient-to-r from-red-50/80 to-rose-50/80 border-red-200/50"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  submitStatus.type === "success" 
                    ? "bg-gradient-to-r from-emerald-500 to-green-500" 
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                }`}>
                  {submitStatus.type === "success" ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      submitStatus.type === "success"
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    {submitStatus.type === "success"
                      ? "Project Submitted Successfully!"
                      : "Submission Error"}
                  </h3>
                  {submitStatus.type === "error" && (
                    <p className="text-red-700 mb-4">{submitStatus.message}</p>
                  )}

                  {submitStatus.type === "success" && (
                    <div className="mt-4 space-y-4">
                      {/* Success Message */}
                      <p className="text-green-700">
                        Your project has been added to our showcase! 🎉
                      </p>

                      {/* Shareable Link */}
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          Shareable Link:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={submitStatus.shareableLink || ""}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(submitStatus.shareableLink || "")
                            }
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/project/${projectId}`)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          View Project
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/gallery")}
                          className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                          Browse Gallery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Help Section */}
        <div className="mt-12 text-center">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h4 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Need Help?
            </h4>
            <p className="text-lg text-gray-600 mb-6">
              Join our amazing community for support, tips, and inspiration
            </p>
            <a
              href="https://discord.gg/PePSDqKB"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
            >
              <div className="w-6 h-6 bg-white/20 rounded-lg mr-3 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </div>
              Join Discord Community
            </a>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HackathonShowcase;
