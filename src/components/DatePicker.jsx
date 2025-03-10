import React, { useState, useRef, useEffect } from 'react';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import './DatePicker.css';

export default function DatePicker({ 
  value, 
  onChange, 
  minDate, 
  placeholder = 'Select date',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const wrapperRef = useRef(null);
  
  // Convert string date to Date object for the picker
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  
  // Convert minDate string to Date object
  const minDateObj = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : undefined;
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
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
  
  // Prevent body scrolling when calendar is open on mobile
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);
  
  // Close the calendar
  const handleClose = () => {
    setIsOpen(false);
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle day selection
  const handleDaySelect = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    onChange(formattedDate);
    setIsOpen(false);
  };
  
  // Generate calendar days
  const renderCalendar = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(monthEnd);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const dateFormat = "d";
    const days = [];
    let day = startDate;
    
    // Create weeks array (6 rows)
    for (let i = 0; i < 6; i++) {
      const week = [];
      
      // Create days for a week (7 columns)
      for (let j = 0; j < 7; j++) {
        const cloneDay = new Date(day);
        const formattedDate = format(cloneDay, 'yyyy-MM-dd');
        const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === formattedDate;
        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
        const isToday = formattedDate === format(new Date(), 'yyyy-MM-dd');
        const isDisabled = minDateObj && day < minDateObj;
        
        week.push(
          <div 
            key={j} 
            className={`calendar-day ${!isCurrentMonth ? 'outside-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => !isDisabled && handleDaySelect(cloneDay)}
          >
            {format(day, dateFormat)}
          </div>
        );
        
        day = new Date(day);
        day.setDate(day.getDate() + 1);
      }
      
      days.push(
        <div key={i} className="calendar-week">
          {week}
        </div>
      );
      
      if (days.length === 6) break;
    }
    
    return days;
  };
  
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
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleClose}
            />
          )}
          
          <div className="islago-date-picker">
            {isMobile && (
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">Select Date</h3>
                <button 
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-gray-200"
                  aria-label="Close calendar"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}
            
            <div className="calendar-container">
              <div className="calendar-header">
                <button 
                  onClick={prevMonth}
                  className="month-nav"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="current-month">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button 
                  onClick={nextMonth}
                  className="month-nav"
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="calendar-days-header">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                  <div key={index} className="weekday-header">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
            </div>
            
            {isMobile && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
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