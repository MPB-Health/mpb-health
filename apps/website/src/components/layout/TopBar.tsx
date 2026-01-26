import React from 'react';
import { Phone, Clock, ExternalLink, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TopBar = () => {
  return (
    <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-b border-neutral-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-xs">
          <div className="hidden lg:flex items-center space-x-6">
            <a
              href="tel:8558164650"
              className="flex items-center space-x-2 hover:text-cyan-400 transition-colors group"
            >
              <Phone className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">(855) 816-4650</span>
            </a>

            <div className="flex items-center space-x-2 text-neutral-300">
              <Clock className="h-3.5 w-3.5" />
              <span>Mon-Fri: 9am-5pm EST</span>
            </div>

          </div>

          {/* Centered tagline - visible on medium screens and up */}
          <div className="hidden md:flex flex-1 justify-center">
            <span className="text-cyan-400 font-medium text-xs tracking-wide">
              Not Insurance — The Smarter, More Affordable Way to Pay for Healthcare Costs
            </span>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            <Link
              to="/support"
              className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors font-medium group"
            >
              <HelpCircle className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Support</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-neutral-600"></div>

            <a
              href="https://app.mpb.health/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors font-medium group"
            >
              <span>Member Portal</span>
              <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform" />
            </a>

            <div className="hidden sm:block h-4 w-px bg-neutral-600"></div>

            <Link
              to="/download-app"
              className="hidden sm:flex items-center space-x-1.5 hover:text-cyan-400 transition-colors font-medium group"
            >
              <span>Download App</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
