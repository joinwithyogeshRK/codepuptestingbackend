import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Home,
  LayoutGrid,
  Grid3X3,
  Search,
  Eye,
  ExternalLink,
  Heart,
  Calendar,
  Loader,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

// Type definitions - aligned with backend (moved to separate file would be better)
interface HackathonPost {
  id: number;
  name: string;
  deployedLink: string;
  description: string;
  shareableLink: string;
  likes: number;
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
  data: HackathonPost[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ProjectCardProps {
  project: HackathonPost;
  onLike: (projectId: number, newLikeStatus: boolean) => void;
  isLiked?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onLike,
  isLiked = false,
}) => {
  const [localLikes, setLocalLikes] = useState<number>(project.likes);
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(isLiked);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const handleLike = async (): Promise<void> => {
    if (isLiking) return;

    // Redirect to sign in if not authenticated
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }

    try {
      setIsLiking(true);

      // Store original values for rollback
      const originalIsLiked = localIsLiked;
      const originalLikes = localLikes;

      // Optimistic UI update
      setLocalIsLiked(!localIsLiked);
      setLocalLikes((prev) => (localIsLiked ? prev - 1 : prev + 1));

      const token = await getToken();

      // Call API to toggle like status
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/${project.id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Revert if API call fails
        setLocalIsLiked(originalIsLiked);
        setLocalLikes(originalLikes);
        throw new Error(`Failed to like project: ${response.status}`);
      }

      // Update parent component with new like status
      onLike(project.id, !localIsLiked);
    } catch (error) {
      console.error("Error liking project:", error);
      // Revert optimistic update on error
      setLocalIsLiked(localIsLiked);
      setLocalLikes(project.likes);
    } finally {
      setIsLiking(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Generate consistent background colors based on project ID
  const bgColors = [
    "bg-gradient-to-br from-pink-500 to-red-500",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-green-400 to-emerald-600",
    "bg-gradient-to-br from-amber-400 to-orange-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-cyan-400 to-cyan-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
  ];

  const bgColor = bgColors[project.id % bgColors.length];
  const textColor = "text-white";

  return (
    <div
      className={`${bgColor} ${textColor} rounded-xl shadow-lg overflow-hidden h-80 flex flex-col`}
    >
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">{project.name}</h3>
          <p className="text-sm opacity-90 mb-4 line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(project.createdAt)}
          </span>
          {project.user && (
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {project.user.firstName || project.user.email.split("@")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-black/20 flex items-center justify-between">
        <a
          href={project.deployedLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Visit App
        </a>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart
              className={`w-4 h-4 ${
                localIsLiked ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
            <span className="text-sm">{localLikes}</span>
          </button>

          <button
            onClick={() => navigate(`/project/${project.id}`)}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectGallery: React.FC = () => {
  const [projects, setProjects] = useState<HackathonPost[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<HackathonPost[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [likedProjects, setLikedProjects] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const fetchProjects = async (
    pageNum: number = 1,
    append: boolean = false
  ): Promise<void> => {
    const token = await getToken();
    try {
      setLoading(true);
      setError(null);

      const url = `${
        import.meta.env.VITE_BASE_URL
      }/api/hackathon?page=${pageNum}&limit=12`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        if (append) {
          setProjects((prev) => [...prev, ...data.data]);
          setFilteredProjects((prev) => [...prev, ...data.data]);
        } else {
          setProjects(data.data);
          setFilteredProjects(data.data);
        }

        // Check if there are more pages
        if (data.pagination && data.data.length < data.pagination.limit) {
          setHasMore(false);
        } else {
          setHasMore(data.data.length === 12);
        }
      } else {
        throw new Error(data.error || "Failed to fetch projects");
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);

      let errorMessage = "Failed to fetch projects";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    fetchProjects(1, false);
  }, []);

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.user?.firstName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const handleLike = (projectId: number, isLiked: boolean): void => {
    // Update local state to reflect the like
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              likes: isLiked ? project.likes + 1 : project.likes - 1,
            }
          : project
      )
    );

    // Update liked projects set
    if (isLiked) {
      setLikedProjects((prev) => new Set(prev).add(projectId));
    } else {
      setLikedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleLoadMore = (): void => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProjects(nextPage, true);
  };

  const totalLikes = projects.reduce((sum, project) => sum + project.likes, 0);

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading amazing projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg">
              <LayoutGrid className="w-4 h-4" />
              <Grid3X3 className="w-4 h-4" />
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              <span className="font-medium">Home</span>
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-5xl font-bold text-emerald-600">
              Project Gallery
            </h1>
            <span className="ml-4 text-2xl">✨</span>
          </div>
          <p className="text-slate-600 text-lg mb-6">
            Discover amazing projects built by our talented community of
            creators
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span>{projects.length} projects submitted</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              <span>{totalLikes} total likes</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-2 flex items-center">
            <div className="flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 ml-4 mr-3" />
              <input
                type="text"
                placeholder="Search projects by name, description, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              setPage(1);
              fetchProjects(1, false);
            }}
            disabled={loading}
            className="bg-white text-slate-600 px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50 flex items-center"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : "🔄 "}
            Refresh Projects
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading projects:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => {
                setPage(1);
                fetchProjects(1, false);
              }}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                  isLiked={likedProjects.has(project.id)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Load More Projects
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No projects found
                </h3>
                <p className="text-slate-500 mb-4">
                  No projects match your search for "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Show All Projects
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No projects yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Be the first to submit an amazing project!
                </p>
                <button
                  onClick={() => navigate("/submit")}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Submit Your Project
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectGallery;
