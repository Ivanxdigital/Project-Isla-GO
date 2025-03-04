// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    company: {
      title: 'Company',
      links: [
        { name: 'About', href: '/about', description: 'Learn more about IslaGo' },
        { name: 'Contact', href: '/contact', description: 'Get in touch with us' },
        { name: 'Careers', href: '/careers', description: 'Join our team at IslaGo' },
        { name: 'Privacy Policy', href: '/privacy', description: 'Read our privacy policy' }
      ]
    },
    services: {
      title: 'Services',
      links: [
        { name: 'Book a Trip', href: '/#booking', description: 'Book your next journey' },
        { name: 'Manage Booking', href: '/manage-bookings', description: 'View or modify your bookings' },
        { name: 'Popular Routes', href: '/routes', description: 'Explore our most popular routes' },
        { name: 'Special Offers', href: '/offers', description: 'View our current promotions' }
      ]
    },
    social: {
      title: 'Social',
      links: [
        { 
          name: 'Facebook', 
          href: 'https://facebook.com', 
          external: true, 
          description: "Visit IslaGo's Facebook page",
          icon: FaFacebook 
        },
        { 
          name: 'Twitter', 
          href: 'https://twitter.com', 
          external: true, 
          description: "Follow IslaGo on Twitter",
          icon: FaTwitter 
        },
        { 
          name: 'Instagram', 
          href: 'https://instagram.com', 
          external: true, 
          description: "Follow IslaGo on Instagram",
          icon: FaInstagram 
        },
        { 
          name: 'LinkedIn', 
          href: 'https://linkedin.com', 
          external: true, 
          description: "Connect with IslaGo on LinkedIn",
          icon: FaLinkedin 
        }
      ]
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              <Link to="/" aria-label="IslaGo home" className="hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded">
                IslaGo.
              </Link>
            </h2>
            <p className="text-gray-600 mb-2">
              Making travel easier and haggle free.
            </p>
            <address className="not-italic space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span>{' '}
                <a 
                  href="mailto:contact@islago.com" 
                  className="text-ai-600 hover:text-ai-700 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded"
                  aria-label="Send email to contact@islago.com"
                >
                  contact@islago.com
                </a>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span>{' '}
                <a 
                  href="tel:+639993702550" 
                  className="text-ai-600 hover:text-ai-700 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded"
                  aria-label="Call us at +63 9993702550"
                >
                  +63 9993702550
                </a>
              </p>
            </address>
          </div>

          {/* Quick Links */}
          <nav 
            className="grid grid-cols-2 gap-8 md:col-span-2" 
            aria-label="Footer navigation"
          >
            {Object.entries(footerSections).map(([key, section]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                {key === 'social' ? (
                  <div className="flex space-x-4">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.name}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded-full p-2 transition-colors duration-200"
                          aria-label={link.description}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                          <span className="sr-only">{link.name}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="space-y-3" role="list">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded transition-colors duration-200"
                            aria-label={link.description}
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-gray-600 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded transition-colors duration-200"
                            aria-label={link.description}
                          >
                            {link.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm" role="contentinfo">
              &copy; {currentYear} IslaGo. All rights reserved.
            </p>
            <nav className="mt-4 md:mt-0 flex space-x-6" aria-label="Legal navigation">
              <Link 
                to="/terms" 
                className="text-sm text-gray-500 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded"
                aria-label="Read our Terms of Service"
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                className="text-sm text-gray-500 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded"
                aria-label="Read our Privacy Policy"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/cookies" 
                className="text-sm text-gray-500 hover:text-ai-600 focus:outline-none focus:ring-2 focus:ring-ai-600 focus:ring-offset-2 rounded"
                aria-label="Read our Cookie Policy"
              >
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}