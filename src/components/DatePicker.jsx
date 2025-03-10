import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import 'react-day-picker/dist/style.css';
import './DatePicker.css';

export default function DatePicker({ 
  value, 
  onChange, 
  minDate, 
  placeholder = 'Select date',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  
  // Convert string date to Date object for the picker
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  
  // Convert minDate string to Date object
  const minDateObj = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : undefined;
  
  // Handle day selection
  const handleDaySelect = (day) => {
    if (day) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      onChange(formattedDate);
      setIsOpen(false);
    }
  };
  
  // Format date for display
  const displayDate = selectedDate 
    ? format(selectedDate, 'MMM dd, yyyy') 
    : placeholder;
  
  // Close the picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between hover:border-blue-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`${!selectedDate ? 'text-gray-500' : 'text-gray-900'}`}>
          {displayDate}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-20 mt-1 bg-white rounded-lg shadow-xl p-4 border border-gray-200 islago-date-picker">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            fromDate={minDateObj}
            modifiersClassNames={{
              selected: 'bg-blue-600 text-white rounded-md',
              today: 'bg-gray-100 font-bold rounded-md'
            }}
            styles={{
              caption: { color: '#4B5563' },
              day: { margin: '0.2em' }
            }}
            className="custom-day-picker"
          />
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input 
        type="hidden" 
        name="date" 
        value={value || ''} 
        required={!!minDate} 
      />
    </div>
  );
} 