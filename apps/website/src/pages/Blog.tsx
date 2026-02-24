import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, TrendingUp, Heart, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { supabase, isSupabaseConfigured, BlogArticle } from '../lib/supabase';
import { NewsletterSubscribe } from '../components/blocks/NewsletterSubscribe';

const Blog: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchBlogPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_articles')
          .select('*')
          .eq('is_published', true)
          .neq('category', 'Event')
          .order('published_date', { ascending: false });

        // Silently handle missing table
        if (error?.message?.includes('schema cache') || 
            error?.code === 'PGRST204' ||
            error?.code === 'PGRST205') {
          setBlogPosts([]);
          return;
        }
        if (error) throw error;
        if (data) setBlogPosts(data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>Healthcare Blog | MPB Health</title>
        <meta
          name="description"
          content="Stay informed with MPB Health's blog. Expert insights on healthcare, wellness, medical cost sharing, and affordable healthcare solutions."
        />
      </Helmet>

      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50/50" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="/assets/newsletter-blog-images-2.jpg"
            alt="Healthcare Blog"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/80" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              <BookOpen className="w-3 h-3 mr-1" />
              Healthcare Blog
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 text-balance">
              Healthcare Insights & Wellness Tips
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Expert insights on healthcare, wellness, and living your healthiest life.
            </p>

            <div className="inline-flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                {blogPosts.length}+ Articles
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Weekly Updates
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-600" />
                Expert Advice
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-b from-white to-gray-50">
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                <BookOpen className="w-3 h-3 mr-1" />
                Latest Articles
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Healthcare Insights & Updates
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore our complete collection of healthcare insights and wellness tips
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 animate-pulse">
                    <div className="h-56 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No articles available yet</h3>
                <p className="text-lg text-gray-600">Check back soon for new content!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-400"
                  >
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                      <img
                        src={post.featured_image_url.startsWith('http') ? post.featured_image_url : `/${post.featured_image_url.replace(/^\//, '')}`}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
                      <Badge className="absolute top-4 left-4 bg-white/90 text-gray-900 border-0 backdrop-blur-sm">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.published_date)}</span>
                        </div>
                        {post.read_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.read_time} min</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <NewsletterSubscribe source="blog" variant="default" />
          </div>
        </section>
      </div>
    </>
  );
};

export { Blog };
export default Blog;
