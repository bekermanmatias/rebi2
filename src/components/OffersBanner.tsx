import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Banner } from '../types';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Props {
  banners: Banner[];
}

const gradients = [
  'from-red-800 via-red-900 to-gray-900',
  'from-gray-900 via-gray-800 to-red-900',
  'from-red-900 via-red-800 to-orange-900',
];

export default function OffersBanner({ banners }: Props) {
  if (!banners.length) return null;

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop={banners.length > 1}
        className="offers-swiper"
      >
        {banners.map((banner, i) => (
          <SwiperSlide key={banner.id}>
            {banner.image_url ? (
              <div className="relative h-[300px] w-full sm:h-[400px] lg:h-[450px]">
                <img
                  src={banner.image_url}
                  alt={banner.title ?? 'Oferta'}
                  className="h-full w-full object-cover"
                />
                {banner.title && (
                  <div className="absolute inset-0 flex items-center bg-black/30">
                    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                      <h2 className="text-3xl font-extrabold italic text-white sm:text-5xl lg:text-6xl">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="mt-4 max-w-lg text-base text-gray-200 sm:text-lg">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.cta_text && banner.cta_link && (
                        <a
                          href={banner.cta_link}
                          className="mt-6 inline-block rounded-lg border-2 border-white bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-gray-900"
                        >
                          {banner.cta_text}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`relative flex h-[300px] w-full items-center bg-gradient-to-br sm:h-[400px] lg:h-[450px] ${gradients[i % gradients.length]}`}
              >
                <div className="absolute inset-0 opacity-10">
                  <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`grid-${i}`} width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${i})`} />
                  </svg>
                </div>
                <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-xl">
                    <h2 className="text-3xl font-extrabold italic text-white sm:text-5xl lg:text-6xl">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-4 max-w-lg text-base text-gray-300 sm:text-lg">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.cta_text && banner.cta_link && (
                      <a
                        href={banner.cta_link}
                        className="mt-6 inline-block rounded-lg border-2 border-white bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-gray-900"
                      >
                        {banner.cta_text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .offers-swiper {
          width: 100%;
        }
        .offers-swiper .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
        }
        .offers-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: white;
        }
        .offers-swiper .swiper-button-next,
        .offers-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.3);
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }
        .offers-swiper .swiper-button-next::after,
        .offers-swiper .swiper-button-prev::after {
          font-size: 18px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
