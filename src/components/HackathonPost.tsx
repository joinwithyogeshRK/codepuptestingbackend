import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  Globe,
  Code,
  Share2,
  Copy,
  Check,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

// Reuse the same type definitions
interface HackathonPost {
  id: number;
  name: string;
  deployedLink: string;
  description: string;
  shareableLink: string;
  userId: number;
  createdAt: string;
  user?: {
    id: number;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: HackathonPost;
  error?: string;
}

const IndividualPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<HackathonPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch individual post
  const fetchPost = async (): Promise<void> => {
    if (!id) {
      setError("Invalid post ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setPost(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch post");
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch post");
    } finally {
      setLoading(false);
    }
  };

  // Copy link functionality
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
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

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {error === "Post not found"
              ? "Post Not Found"
              : "Error Loading Post"}
          </h2>
          <p className="text-slate-600 mb-6">
            {error === "Post not found"
              ? "The post you're looking for doesn't exist or has been removed."
              : error || "Something went wrong while loading the post."}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate("/gallery")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Browse Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate background color based on post ID (consistent with ProjectGallery)
  const bgColors = [
    "from-pink-500 to-red-500",
    "from-blue-400 to-blue-600",
    "from-green-400 to-emerald-600",
    "from-amber-400 to-orange-600",
    "from-purple-400 to-purple-600",
    "from-cyan-400 to-cyan-600",
    "from-indigo-400 to-indigo-600",
  ];

  const bgColor = bgColors[post.id % bgColors.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${bgColor} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-white/90 hover:text-white transition-colors bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="flex items-center text-white/90 hover:text-white transition-colors bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Post Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.name}</h1>
            <div className="flex items-center justify-center space-x-6 text-white/90">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.user && (
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  <span>
                    {post.user.firstName && post.user.lastName
                      ? `${post.user.firstName} ${post.user.lastName}`
                      : post.user.firstName || post.user.email.split("@")[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <Code className="w-6 h-6 mr-2 text-emerald-600" />
                About This Project
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4">
                <a
                  href={post.deployedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit Live Project
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            {post.user && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Created By
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {post.user.firstName
                      ? post.user.firstName.charAt(0).toUpperCase()
                      : post.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {post.user.firstName && post.user.lastName
                        ? `${post.user.firstName} ${post.user.lastName}`
                        : post.user.firstName || post.user.email.split("@")[0]}
                    </p>
                    <p className="text-sm text-slate-500">{post.user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Project Links
              </h3>
              <div className="space-y-3 overflow-auto">
                <a
                  href={post.deployedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Globe className="w-5 h-5 text-emerald-600 mr-3" />
                  <div>
                    <p className="font-medium text-slate-800">Live Demo</p>
                    <p className="text-sm text-slate-500 truncate">
                      {post.deployedLink}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
                </a>

                <button
                  onClick={() => copyToClipboard(post.shareableLink)}
                  className="w-full flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-blue-600 mr-3" />
                  <div className="text-left flex-1">
                    <p className="font-medium text-slate-800">Share Link</p>
                    <p className="text-sm text-slate-500">Copy shareable URL</p>
                  </div>
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-green-600 ml-auto" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 ml-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* More Projects CTA */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 text-center">
              <h3 className="font-semibold text-emerald-800 mb-2">
                Discover More Projects
              </h3>
              <p className="text-sm text-emerald-600 mb-4">
                Explore other amazing projects from our community
              </p>
              <button
                onClick={() => navigate("/gallery")}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Browse Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualPost;
