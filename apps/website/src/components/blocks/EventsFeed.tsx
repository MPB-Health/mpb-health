import React from 'react';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';

const EventsFeed = () => {
  const events = [
    {
      title: 'Understanding Health Sharing Basics',
      type: 'Webinar',
      date: '2025-01-15',
      time: '7:00 PM EST',
      attendees: 156,
      description: 'Join our member specialists for an introduction to health sharing and how it works.',
      featured: true,
    },
    {
      title: 'Wellness Workshop: Preventive Care',
      type: 'Workshop',
      date: '2025-01-22',
      time: '6:30 PM EST',
      attendees: 89,
      description: 'Learn about preventive care options and how they\'re covered in health sharing.',
      featured: false,
    },
    {
      title: 'Member Meetup: Atlanta Area',
      type: 'In-Person',
      date: '2025-01-28',
      time: '2:00 PM EST',
      attendees: 24,
      description: 'Connect with fellow MPB Health members in the Atlanta area.',
      featured: false,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">
            Community Events
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Join our community events to learn more about health sharing, connect with other members, and get your questions answered.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Event */}
          {events.filter(event => event.featured).map((event, index) => (
            <div key={index} className="lg:col-span-2">
              <Card hover className="h-full animate-fade-up">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="primary">Featured Event</Badge>
                    <Badge variant="accent">{event.type}</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-3">{event.title}</CardTitle>
                  <CardDescription className="text-base mb-6">
                    {event.description}
                  </CardDescription>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees} registered</span>
                    </div>
                    <Button className="group">
                      Register Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Regular Events */}
          <div className="space-y-6">
            {events.filter(event => !event.featured).map((event, index) => (
              <Card key={index} hover className="animate-fade-up" style={{animationDelay: `${(index + 1) * 0.1}s`}}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default">{event.type}</Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {event.description}
                  </CardDescription>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Events
          </Button>
        </div>
      </div>
    </section>
  );
};

export { EventsFeed };