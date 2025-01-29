import React, { useEffect } from 'react';
import HeroSection from './HeroSection';
import BookingForm from './BookingForm';
import WhyIslaGO from './WhyIslaGO';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast[location.state.type || 'success'](location.state.message);
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <div id="booking">
        <BookingForm />
      </div>
      <WhyIslaGO />
    </div>
  );
}