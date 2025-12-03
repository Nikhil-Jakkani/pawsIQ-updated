import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCommentAlt, FaSearch, FaFilter, FaPlus, FaHeart, FaRegHeart, FaComment, FaEye, FaCalendarAlt, FaUser, FaDog, FaCat, FaChevronDown, FaChevronUp, FaEllipsisH, FaShare, FaFlag, FaFire, FaStar, FaTrophy, FaUsers } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';

const UserCommunity = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);

  // Mock user data
  const currentUser = {
    id: 1,
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  // Mock forum posts data
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Tips for introducing a new cat to your dog?',
      content: 'I\'m planning to adopt a cat next week, but I already have a 3-year-old Golden Retriever. Does anyone have experience introducing cats to dogs? I want to make sure the transition goes smoothly for both pets. Any advice would be greatly appreciated!',
      author: {
        id: 2,
        name: 'Emily Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      category: 'advice',
      tags: ['cats', 'dogs', 'pet-introduction'],
      date: '2023-12-10T14:30:00',
      likes: 24,
      comments: 8,
      views: 156,
      isLiked: false
    },
    {
      id: 2,
      title: 'Best food for a senior Labrador with joint issues?',
      content: 'My 12-year-old Labrador has been showing signs of joint pain lately. The vet recommended a diet change to help with his mobility issues. Has anyone tried special senior dog food formulas that helped with joint health? Looking for brand recommendations and experiences.',
      author: {
        id: 3,
        name: 'Michael Brown',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
      },
      category: 'nutrition',
      tags: ['senior-dogs', 'joint-health', 'dog-food'],
      date: '2023-12-08T09:15:00',
      likes: 18,
      comments: 12,
      views: 203,
      isLiked: true
    },
    {
      id: 3,
      title: 'Upcoming Pet-Friendly Festival in Downtown',
      content: 'Just wanted to share that there\'s a pet-friendly festival happening downtown next weekend! There will be adoption events, pet product vendors, training demonstrations, and even a pet costume contest. I went last year and it was amazing. Anyone else planning to attend?',
      author: {
        id: 4,
        name: 'Sarah Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/28.jpg'
      },
      category: 'events',
      tags: ['festival', 'pet-friendly', 'community'],
      date: '2023-12-05T16:45:00',
      likes: 32,
      comments: 15,
      views: 278,
      isLiked: false
    },
    {
      id: 4,
      title: 'How to stop my puppy from chewing furniture?',
      content: 'My 6-month-old Beagle puppy has started chewing on furniture legs and baseboards. I\'ve tried bitter apple spray and providing plenty of chew toys, but he still goes for the furniture when I\'m not looking. Any training tips or solutions that worked for your puppies?',
      author: {
        id: 5,
        name: 'David Clark',
        avatar: 'https://randomuser.me/api/portraits/men/36.jpg'
      },
      category: 'training',
      tags: ['puppies', 'chewing', 'behavior'],
      date: '2023-12-03T11:20:00',
      likes: 15,
      comments: 20,
      views: 245,
      isLiked: false
    },
    {
      id: 5,
      title: "Success story: My rescue cat's transformation",
      content: 'I wanted to share my experience with adopting a rescue cat who was extremely shy and fearful. When I first brought Luna home 6 months ago, she would hide all day and wouldn\'t let anyone near her. With patience, love, and some techniques I learned from this community, she\'s now a confident, affectionate cat who greets me at the door! I\'ve attached before and after photos to show her amazing transformation.',
      author: {
        id: 6,
        name: 'Jennifer Lee',
        avatar: 'https://randomuser.me/api/portraits/women/52.jpg'
      },
      category: 'success-stories',
      tags: ['rescue-cats', 'transformation', 'adoption'],
      date: '2023-11-30T13:40:00',
      likes: 47,
      comments: 23,
      views: 312,
      isLiked: true
    },
    {
      id: 6,
      title: 'Managing seasonal allergies in dogs',
      content: "My Beagle, Rusty, has started scratching nonstop every time the weather shifts. Our vet confirmed it\'s seasonal allergies, but I\'d love to know what home care routines, supplements, or grooming habits have helped your pups. Looking for practical Health & Wellness tips before trying prescription meds.",
      author: {
        id: 7,
        name: 'Priya Sharma',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
      },
      category: 'health',
      tags: ['allergies', 'health', 'dogs'],
      date: '2023-12-01T10:10:00',
      likes: 21,
      comments: 11,
      views: 189,
      isLiked: false
    }
  ]);

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Toggle post expansion
  const togglePostExpansion = (id) => {
    if (expandedPost === id) {
      setExpandedPost(null);
    } else {
      setExpandedPost(id);
    }
  };

  // Toggle like
  const toggleLike = (id) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        const newIsLiked = !post.isLiked;
        return {
          ...post,
          isLiked: newIsLiked,
          likes: newIsLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Category options
  const categories = [
    { value: 'all', label: 'All Topics' },
    { value: 'advice', label: 'Advice & Questions' },
    { value: 'nutrition', label: 'Pet Nutrition' },
    { value: 'training', label: 'Training & Behavior' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'events', label: 'Events & Meetups' },
    { value: 'success-stories', label: 'Success Stories' }
  ];

  // Popular tags
  const popularTags = [
    'dogs', 'cats', 'puppies', 'kittens', 'training', 'health', 'nutrition', 'adoption', 'behavior', 'grooming'
  ];

  // Trending topics
  const trendingTopics = [
    {
      title: 'Winter care tips for outdoor pets',
      comments: 34,
      category: 'health'
    },
    {
      title: 'Best interactive toys for cats',
      comments: 28,
      category: 'advice'
    },
    {
      title: 'How to prepare your pet for a new baby',
      comments: 42,
      category: 'training'
    }
  ];

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pet-purple-500 via-pet-pink-500 to-pet-orange-500 rounded-3xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                    <FaUsers className="text-white text-3xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">Pet Owner Community</h1>
                    <p className="text-white/90 mt-2 text-lg">Connect, share, and learn with fellow pet lovers</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-lg" />
                    <span className="font-semibold">12,458 Members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCommentAlt className="text-lg" />
                    <span className="font-semibold">3,721 Discussions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaFire className="text-lg" />
                    <span className="font-semibold">142 Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/user/community/new-post')}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 font-semibold border border-white/20 hover:border-white/40"
              >
                <FaPlus className="text-lg" />
                Start Discussion
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pet-purple-400" />
              <input
                type="text"
                placeholder="Search discussions, topics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pet-purple-500 focus:border-pet-purple-500 bg-white/70 backdrop-blur-sm transition-all duration-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pet-purple-500 focus:border-pet-purple-500 bg-white/70 backdrop-blur-sm font-medium"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-pet-purple-50 transition-all duration-300 font-medium"
              >
                <FaFilter className="text-pet-purple-500" />
                <span>Filters</span>
                {showFilters ? <FaChevronUp className="text-pet-purple-500" /> : <FaChevronDown className="text-pet-purple-500" />}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-4 py-2 bg-gradient-to-r from-pet-purple-100 to-pet-pink-100 hover:from-pet-purple-200 hover:to-pet-pink-200 text-pet-purple-700 rounded-full text-sm font-medium transition-all duration-300 border border-pet-purple-200 hover:border-pet-purple-300"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                  }}
                  className="text-pet-purple-600 hover:text-pet-purple-700 text-sm font-semibold bg-pet-purple-50 hover:bg-pet-purple-100 px-4 py-2 rounded-xl transition-all duration-300"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forum Posts */}
            {filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <div
                    key={post.id}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{post.author.name}</p>
                            <p className="text-sm text-gray-500">{formatDate(post.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${post.category === 'advice' ? 'bg-pet-blue-100 text-pet-blue-800' :
                              post.category === 'nutrition' ? 'bg-pet-orange-100 text-pet-orange-800' :
                                post.category === 'training' ? 'bg-pet-purple-100 text-pet-purple-800' :
                                  post.category === 'health' ? 'bg-green-100 text-green-800' :
                                    post.category === 'events' ? 'bg-pet-pink-100 text-pet-pink-800' :
                                      'bg-gray-100 text-gray-800'
                            }`}>
                            {post.category.replace('-', ' ')}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <FaEllipsisH />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3
                          className="text-xl font-bold text-gray-800 cursor-pointer hover:text-pet-purple-600 transition-colors leading-tight"
                          onClick={() => togglePostExpansion(post.id)}
                        >
                          {post.title}
                        </h3>

                        <div className={`mt-3 text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                          <p>{post.content}</p>
                        </div>

                        {post.content.length > 150 && expandedPost !== post.id && (
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="mt-2 text-pet-purple-600 hover:text-pet-purple-700 text-sm font-semibold bg-pet-purple-50 hover:bg-pet-purple-100 px-3 py-1 rounded-full transition-all duration-300"
                          >
                            Read more
                          </button>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-pet-purple-100 hover:to-pet-pink-100 text-gray-700 hover:text-pet-purple-700 text-xs font-medium rounded-full cursor-pointer transition-all duration-300"
                              onClick={() => setSearchTerm(tag)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 font-medium ${post.isLiked
                                ? 'bg-pet-pink-100 text-pet-pink-600 hover:bg-pet-pink-200'
                                : 'text-gray-500 hover:text-pet-pink-600 hover:bg-pet-pink-50'
                              }`}
                          >
                            {post.isLiked ? <FaHeart className="text-pet-pink-600" /> : <FaRegHeart />}
                            <span>{post.likes}</span>
                          </button>
                          <button
                            onClick={() => navigate(`/user/community/post/${post.id}`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-500 hover:text-pet-blue-600 hover:bg-pet-blue-50 transition-all duration-300 font-medium"
                          >
                            <FaComment />
                            <span>{post.comments}</span>
                          </button>
                          <div className="flex items-center gap-2 px-3 py-2 text-gray-500 font-medium">
                            <FaEye />
                            <span>{post.views}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-full text-gray-400 hover:text-pet-purple-600 hover:bg-pet-purple-50 transition-all duration-300">
                            <FaShare />
                          </button>
                          <button className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300">
                            <FaFlag />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white/90 to-pet-purple-50/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20 shadow-lg">
                <div className="bg-gradient-to-br from-pet-purple-500 to-pet-pink-500 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <FaCommentAlt className="text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No discussions found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {searchTerm || filterCategory !== 'all'
                    ? "No discussions match your search criteria. Try adjusting your filters or explore different topics."
                    : "Be the first to start a meaningful discussion in our pet-loving community!"}
                </p>
                <button
                  onClick={() => navigate('/user/community/new-post')}
                  className="bg-gradient-to-r from-pet-purple-600 to-pet-pink-600 hover:from-pet-purple-700 hover:to-pet-pink-700 text-white px-6 py-3 rounded-xl inline-flex items-center gap-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FaPlus />
                  Start a Discussion
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <div className="bg-gradient-to-br from-white/90 to-pet-purple-50/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
              <div className="px-6 py-4 bg-gradient-to-r from-pet-purple-500 to-pet-pink-500 text-white">
                <div className="flex items-center gap-2">
                  <FaTrophy className="text-xl" />
                  <h3 className="font-bold text-lg">Community Stats</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-pet-blue-50 to-pet-blue-100 rounded-xl">
                    <div className="text-2xl font-bold text-pet-blue-600 mb-1">12,458</div>
                    <div className="text-sm font-medium text-pet-blue-700">Members</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-pet-purple-50 to-pet-purple-100 rounded-xl">
                    <div className="text-2xl font-bold text-pet-purple-600 mb-1">3,721</div>
                    <div className="text-sm font-medium text-pet-purple-700">Discussions</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-pet-orange-50 to-pet-orange-100 rounded-xl">
                    <div className="text-2xl font-bold text-pet-orange-600 mb-1">28,945</div>
                    <div className="text-sm font-medium text-pet-orange-700">Comments</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-1">142</div>
                    <div className="text-sm font-medium text-green-700">Online Now</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-gradient-to-br from-white/90 to-pet-orange-50/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
              <div className="px-6 py-4 bg-gradient-to-r from-pet-orange-500 to-pet-pink-500 text-white">
                <div className="flex items-center gap-2">
                  <FaFire className="text-xl" />
                  <h3 className="font-bold text-lg">Trending Topics</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                    <div className="bg-gradient-to-br from-pet-orange-500 to-pet-pink-500 w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 group-hover:text-pet-orange-600 transition-colors leading-tight">
                        {topic.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${topic.category === 'advice' ? 'bg-pet-blue-100 text-pet-blue-800' :
                            topic.category === 'nutrition' ? 'bg-pet-orange-100 text-pet-orange-800' :
                              topic.category === 'training' ? 'bg-pet-purple-100 text-pet-purple-800' :
                                topic.category === 'health' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                          }`}>
                          {topic.category}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <FaComment size={12} />
                          <span className="font-medium">{topic.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-gradient-to-br from-white/90 to-pet-pink-50/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
              <div className="px-6 py-4 bg-gradient-to-r from-pet-pink-500 to-pet-purple-500 text-white">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-xl" />
                  <h3 className="font-bold text-lg">Upcoming Events</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                  <div className="bg-gradient-to-br from-pet-pink-500 to-pet-purple-500 p-3 rounded-xl shadow-md">
                    <FaCalendarAlt className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 group-hover:text-pet-pink-600 transition-colors">Pet-Friendly Festival</h4>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Dec 16-17, 2023 • Downtown</p>
                    <button className="mt-2 text-sm text-pet-pink-600 hover:text-pet-pink-700 font-semibold bg-pet-pink-50 hover:bg-pet-pink-100 px-3 py-1 rounded-full transition-all duration-300">
                      View Details
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                  <div className="bg-gradient-to-br from-pet-blue-500 to-pet-purple-500 p-3 rounded-xl shadow-md">
                    <FaCalendarAlt className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 group-hover:text-pet-blue-600 transition-colors">Dog Training Workshop</h4>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Dec 23, 2023 • Central Park</p>
                    <button className="mt-2 text-sm text-pet-blue-600 hover:text-pet-blue-700 font-semibold bg-pet-blue-50 hover:bg-pet-blue-100 px-3 py-1 rounded-full transition-all duration-300">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gradient-to-r from-pet-pink-50 to-pet-purple-50 border-t border-white/20">
                <button
                  onClick={() => navigate('/user/community/events')}
                  className="text-pet-purple-600 hover:text-pet-purple-700 text-sm font-semibold bg-white/50 hover:bg-white/70 px-4 py-2 rounded-xl transition-all duration-300 w-full"
                >
                  View All Events
                </button>
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-pet-blue-500 text-white">
                <div className="flex items-center gap-2">
                  <FaStar className="text-xl" />
                  <h3 className="font-bold text-lg">Active Members</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://randomuser.me/api/portraits/women/44.jpg"
                        alt="Emily Wilson"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Emily Wilson</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-pet-pink-100 p-1 rounded-full">
                      <FaDog className="text-pet-pink-600 text-sm" />
                    </div>
                    <div className="bg-gray-100 p-1 rounded-full">
                      <FaCat className="text-gray-600 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://randomuser.me/api/portraits/men/22.jpg"
                        alt="Michael Brown"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Michael Brown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-pet-pink-100 p-1 rounded-full">
                      <FaDog className="text-pet-pink-600 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://randomuser.me/api/portraits/women/28.jpg"
                        alt="Sarah Johnson"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Sarah Johnson</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-pet-pink-100 p-1 rounded-full">
                      <FaDog className="text-pet-pink-600 text-sm" />
                    </div>
                    <div className="bg-gray-100 p-1 rounded-full">
                      <FaCat className="text-gray-600 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-pet-blue-50 border-t border-white/20">
                <button
                  onClick={() => navigate('/user/community/members')}
                  className="text-green-600 hover:text-green-700 text-sm font-semibold bg-white/50 hover:bg-white/70 px-4 py-2 rounded-xl transition-all duration-300 w-full"
                >
                  View All Members
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserCommunity;