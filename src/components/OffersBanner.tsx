import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Banner } from '../types';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Props {
  banners: Banner[];
}

/**
 * Aspect ratios:
 *   Desktop: 1920 × 400  → 24:5  (4.8:1)
 *   Mobile:  1080 × 1080 → 1:1   (cuadrado)
 */

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
        {banners.map((banner) => {
          const hasDesktop = banner.desktop_image_url;
          const hasMobile = banner.mobile_image_url;
          const Wrapper = banner.target_link ? 'a' : 'div';
          const wrapperProps = banner.target_link
            ? { href: banner.target_link }
            : {};

          return (
            <SwiperSlide key={banner.id}>
              <Wrapper {...wrapperProps} className="relative block w-full">
                {hasDesktop || hasMobile ? (
                  <>
                    {/* Mobile: 1080×1080 (1:1) */}
                    {hasMobile && (
                      <img
                        src={banner.mobile_image_url!}
                        alt={banner.title ?? 'Banner promocional'}
                        width={1080}
                        height={1080}
                        className="block aspect-square w-full object-cover sm:hidden"
                        loading="lazy"
                      />
                    )}

                    {/* Desktop fallback on mobile when there's no mobile image */}
                    {!hasMobile && hasDesktop && (
                      <img
                        src={banner.desktop_image_url!}
                        alt={banner.title ?? 'Banner promocional'}
                        width={1920}
                        height={400}
                        className="block aspect-[24/5] w-full object-cover sm:hidden"
                        loading="lazy"
                      />
                    )}

                    {/* Desktop: 1920×400 (24:5) */}
                    {hasDesktop && (
                      <img
                        src={banner.desktop_image_url!}
                        alt={banner.title ?? 'Banner promocional'}
                        width={1920}
                        height={400}
                        className="hidden aspect-[24/5] w-full object-cover sm:block"
                        loading="lazy"
                      />
                    )}

                    {/* Desktop fallback cuando solo hay imagen mobile */}
                    {!hasDesktop && hasMobile && (
                      <img
                        src={banner.mobile_image_url!}
                        alt={banner.title ?? 'Banner promocional'}
                        width={1080}
                        height={1080}
                        className="hidden aspect-[24/5] w-full object-cover sm:block"
                        loading="lazy"
                      />
                    )}
                  </>
                ) : null}
              </Wrapper>
            </SwiperSlide>
          );
        })}
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
