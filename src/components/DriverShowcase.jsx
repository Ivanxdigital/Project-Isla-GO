import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade, Autoplay } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const drivers = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '5 years',
    vanType: '15-Seater Toyota HiAce',
    rating: 4.9,
    trips: 2500,
    specialization: 'Long Distance Routes'
  },
  {
    id: 2,
    name: 'Maria Santos',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '7 years',
    vanType: '15-Seater Toyota HiAce GL',
    rating: 4.8,
    trips: 3100,
    specialization: 'Tourist Groups'
  },
  {
    id: 3,
    name: 'Pedro Reyes',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '4 years',
    vanType: '15-Seater Nissan NV350',
    rating: 4.9,
    trips: 1800,
    specialization: 'Airport Transfers'
  }
];

const DriverShowcase = () => {
  const { t } = useTranslation();

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('drivers.title')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet our professional drivers with years of experience and exceptional service records
          </p>
        </div>

        <div className="relative px-8 md:px-12">
          <Swiper
            modules={[Navigation, Pagination, EffectFade, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={{
              prevEl: '.swiper-button-prev',
              nextEl: '.swiper-button-next',
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true,
              el: '.swiper-pagination'
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false
            }}
            effect="fade"
            loop={true}
            className="driver-showcase-swiper !pb-8"
          >
            {drivers.map((driver) => (
              <SwiperSlide key={driver.id}>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Driver Info Section */}
                    <div className="flex flex-col items-center lg:items-start space-y-4">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-blue-500 ring-opacity-20">
                          <img
                            src={driver.image}
                            alt={driver.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full px-3 py-0.5 text-sm font-medium">
                          {driver.rating} ★
                        </div>
                      </div>

                      <div className="text-center lg:text-left">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{driver.name}</h3>
                        <p className="text-blue-600 text-sm font-medium mb-3">{driver.specialization}</p>
                        
                        <div className="space-y-2 text-gray-600 text-sm">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{driver.experience} of Experience</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{driver.trips}+ Completed Trips</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Section */}
                    <div className="relative">
                      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md">
                        <img
                          src={driver.vanImage}
                          alt={`${driver.name}'s van`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-md p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Vehicle Details</h4>
                        <p className="text-sm text-gray-700">{driver.vanType}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="swiper-button-prev !text-blue-500 !bg-white !w-8 !h-8 !rounded-full !shadow-md"></div>
          <div className="swiper-button-next !text-blue-500 !bg-white !w-8 !h-8 !rounded-full !shadow-md"></div>
          <div className="swiper-pagination !bottom-0 !mb-0"></div>
        </div>
      </div>

      <style jsx="true">{`
        .driver-showcase-swiper {
          margin: 0;
          background: transparent;
        }
        .swiper-pagination {
          bottom: 0 !important;
        }
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          transform: scale(1.2);
        }
        .swiper-button-next,
        .swiper-button-prev {
          top: 50%;
          transform: translateY(-50%);
        }
        .swiper-button-prev {
          left: 0;
        }
        .swiper-button-next {
          right: 0;
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 14px;
          font-weight: bold;
        }
        @media (max-width: 640px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default DriverShowcase; 