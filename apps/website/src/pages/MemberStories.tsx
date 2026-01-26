import React from 'react';
import { Helmet } from 'react-helmet-async';
import { TestimonialShowcase } from '../components/blocks/TestimonialShowcase';

const MemberStories: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Member Stories - Real Families, Real Savings | MPB Health</title>
        <meta
          name="description"
          content="Read inspiring stories from MPB Health members who have saved thousands on healthcare costs. Discover how community health sharing has transformed their lives."
        />
        <meta name="keywords" content="health sharing testimonials, member stories, healthcare savings, MPB Health reviews, real savings stories" />

        {/* Open Graph */}
        <meta property="og:title" content="Member Stories - Real Families, Real Savings | MPB Health" />
        <meta property="og:description" content="Read inspiring stories from MPB Health members who have saved thousands on healthcare costs." />
        <meta property="og:type" content="website" />
      </Helmet>

      <TestimonialShowcase />
    </>
  );
};

export { MemberStories };
export default MemberStories;
