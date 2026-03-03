"use client";

import { ReactNode, useEffect } from "react";
import style from "@/app/(afterLogin)/layout.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NavMenu from "@/app/(afterLogin)/_component/NavMenu";
import LogoutButton from "@/app/(afterLogin)/_component/LogoutButton";
import RightSearchZone from "@/app/(afterLogin)/_component/RightSearchZone";
import RQProvider from "@/app/(afterLogin)/_component/RQProvider";
import FollowRecommendSection from "@/app/(afterLogin)/_component/FollowRecommendSection";
import { useAuthStore } from "@/store/authStore";
import { useProfileLabel } from "@/hooks/useProfileLabel";

type Props = { children: ReactNode };

export default function AfterLoginLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.userId);
  const isOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/auth");
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated) {
    return <div className={style.loading}>Loading...</div>;
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className={style.container}>
      <RQProvider>
        <ProfileGate userId={userId} pathname={pathname}>
          {isOnboarding ? (
            <main className={style.onboardingMain}>{children}</main>
          ) : (
            <>
              <header className={style.leftSectionWrapper}>
                <section className={style.leftSection}>
                  <div className={style.leftSectionFixed}>
                    <Link className={style.logo} href="/home">
                      <div className={style.logoPill}>
                        <span className={style.logoText}>O</span>
                      </div>
                    </Link>
                    <nav>
                      <ul>
                        <NavMenu />
                      </ul>
                      <Link href="/home" className={style.postButton}>
                        <span>Post</span>
                        <svg viewBox="0 0 24 24" width={24} aria-hidden="true">
                          <g>
                            <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path>
                          </g>
                        </svg>
                      </Link>
                    </nav>
                    <LogoutButton />
                  </div>
                </section>
              </header>
              <div className={style.rightSectionWrapper}>
                <div className={style.rightSectionInner}>
                  <main className={style.main}>{children}</main>
                  <section className={style.rightSection}>
                    <RightSearchZone />
                    <div className={style.followRecommend}>
                      <h3>Following</h3>
                      <FollowRecommendSection />
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </ProfileGate>
      </RQProvider>
    </div>
  );
}

function ProfileGate({ children, userId, pathname }: { children: ReactNode; userId?: string; pathname: string }) {
  const router = useRouter();
  const { profile, isLoading } = useProfileLabel(userId);
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!userId || isLoading) {
      return;
    }
    const incomplete = !profile?.username || !profile?.nickname || !profile?.avatarUrl || !profile?.bio;
    if (incomplete && !isOnboardingRoute) {
      router.replace("/onboarding/step-1");
    }
    if (!incomplete && isOnboardingRoute) {
      router.replace("/home");
    }
  }, [userId, isLoading, profile, router, isOnboardingRoute]);

  if (isLoading && !isOnboardingRoute) {
    return <div className={style.loading}>Loading profile...</div>;
  }

  return <>{children}</>;
}
