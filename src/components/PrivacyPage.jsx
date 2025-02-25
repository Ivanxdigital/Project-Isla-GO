import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage({ isOpen, onClose }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen scrollable container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-2xl">
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="prose prose-blue max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">IslaGo Privacy Policy</h1>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-600">
                  Welcome to IslaGo ("we," "us," or "our"). We respect your privacy and are committed to protecting it through our compliance with this policy...
                </p>
              </section>

              {/* Add all other sections similarly */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                <p className="text-gray-600 mb-4">
                  We collect information to provide and improve our service. The types of data we collect include:
                </p>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc pl-5 text-gray-600 mb-4">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Postal or billing address</li>
                </ul>

                {/* Add other subsections */}
              </section>

              {/* Continue with remaining sections */}

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
                <p className="text-gray-600">
                  For questions or concerns about this Privacy Policy, or to exercise your data rights, please contact us at:
                </p>
                <ul className="list-none pl-0 text-gray-600">
                  <li>Email: privacy@islaGo.example</li>
                  <li>Address: IslaGo Privacy Team, 123 Van Avenue, Cityville, Country</li>
                  <li>Phone: +1 (123) 456-7890</li>
                </ul>
              </section>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
} 