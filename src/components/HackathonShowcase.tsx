import React, { useState} from "react";
import {
  
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";

// Type definitions
interface FormData {
  name: string;
  deployedLink: string;
  description: string;
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
  });
   const { getToken } = useAuth();
   const {user} = useUser()
   
   
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
const [projectId , setProjectId] = useState<number>()
  // Get clerkId from your authentication system (you'll need to implement this)
  const getClerkId = (): string => {
    // This should come from your auth context or session
    // For now, using a mock value - replace with actual clerkId from your auth
    return user?.id  || ""; // Replace with actual clerkId
  };
 console.log(projectId)
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
 console.log(projectId);
  // Real backend integration
  const submitToBackend = async (
    projectData: FormData,
    shareableLink: string
  ): Promise<SubmitResponse> => {
    try {
      const clerkId =  getClerkId();
    const token = getToken()
      const submissionPayload = {
        name: projectData.name.trim(),
        deployedLink: projectData.deployedLink.trim(),
        description: projectData.description.trim(),
        shareableLink: shareableLink,
        clerkId: clerkId,
      };
 console.log(projectId);
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

      console.log(response)
     

      const data: SubmitResponse = await response.json();
setProjectId(data?.data?.id)
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
    // Client-side validation
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Project name is required");
    }

    if (!formData.deployedLink.trim()) {
      errors.push("Deployed link is required");
    } else {
      try {
        new URL(formData.deployedLink);
      } catch {
        errors.push("Please enter a valid URL");
      }
    }
 
    if (!formData.description.trim()) {
      errors.push("Project description is required");
    } else if (formData.description.trim().length < 20) {
      errors.push("Project description must be at least 20 characters long");
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
      const shareableLink = `${
        window.location.origin
      }/hackathon/post/${projectId}`;

      const response = await submitToBackend(formData, shareableLink);

      if (response.success && response.data) {
        setSubmitStatus({
          type: "success",
          message: "Project submitted successfully!",
          shareableLink: response.data.shareableLink,
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
        });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div>
          
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-4">
            🎉 Hackathon Showcase
          </h1>
          <p className="text-slate-600 text-lg">
            Submit your amazing project and get a shareable link to showcase
            your work!
          </p>
        </div>

     

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Enter your project name"
                  maxLength={100}
                  required
                />
              </div>

              {/* Deployed Link */}
              <div>
                <label
                  htmlFor="deployedLink"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Deployed Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="deployedLink"
                  name="deployedLink"
                  value={formData.deployedLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="https://your-app.example.com"
                  required
                />
                <div className="flex items-center mt-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                  Enter the URL where your project is deployed
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe your project, its features, technologies used, and what problem it solves..."
                  maxLength={1000}
                  required
                />
                <div className="flex justify-between text-sm text-slate-500 mt-1">
                  <span>Minimum 20 characters</span>
                  <span>{formData.description.length}/1000</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
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
          </form>

          {/* Status Messages */}
          {submitStatus && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                submitStatus.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                {submitStatus.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      submitStatus.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {submitStatus.type === "success"
                      ? "🎉 Project Submitted Successfully!"
                      : submitStatus.message}
                  </p>

                  {submitStatus.type === "success" && (
                    <div className="mt-4 space-y-3">
                      {/* Success Message */}
                      <p className="text-green-700">
                        Your project has been added to our showcase. Here's your
                        shareable link:
                      </p>

                      {/* Shareable Link */}
                      {submitStatus.shareableLink && (
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-slate-700">
                              Your Shareable Link:
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(submitStatus.shareableLink!)
                              }
                              className="flex items-center space-x-2 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-md transition-colors"
                            >
                              {copiedLink ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="bg-slate-100 p-3 rounded border font-mono text-sm break-all">
                            {submitStatus.shareableLink}
                          </div>
                          <a
                            href={submitStatus.shareableLink}
                            className="inline-block mt-2 text-emerald-600 hover:text-emerald-700 text-sm underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Link →
                          </a>
                        </div>
                      )}

                      {/* AI Insights */}
                      {submitStatus.insights && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-3">
                            🤖 AI Project Analysis:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded border">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Category
                              </span>
                              <p className="text-sm font-semibold text-slate-800 mt-1">
                                {submitStatus.insights.category}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Complexity
                              </span>
                              <p className="text-sm font-semibold text-slate-800 mt-1">
                                {submitStatus.insights.complexity}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Marketability
                              </span>
                              <p className="text-sm font-semibold text-slate-800 mt-1">
                                {submitStatus.insights.marketability}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Tech Stack
                              </span>
                              <p className="text-sm font-semibold text-slate-800 mt-1">
                                {submitStatus.insights.techStack.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Need help? Contact us at{" "}
            <a
              href="mailto:support@hackathon.dev"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              support@hackathon.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HackathonShowcase;
