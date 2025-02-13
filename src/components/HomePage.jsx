import React, { useEffect } from 'react';
import HeroSection from './HeroSection.jsx';
import BookingForm from './BookingForm.jsx';
import WhyIslaGO from './WhyIslaGO.jsx';
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
    <div className="flex flex-col">
      <div className="-mt-16 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroSection />
      </div>
      <div id="booking" className="relative bg-white w-full">
        <BookingForm />
      </div>
      <WhyIslaGO />
    </div>
  );
}