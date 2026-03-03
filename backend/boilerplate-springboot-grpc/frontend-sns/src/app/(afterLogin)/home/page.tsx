"use client";

import style from "./home.module.css";
import Tab from "@/app/(afterLogin)/home/_component/Tab";
import TabProvider from "@/app/(afterLogin)/home/_component/TabProvider";
import PostForm from "@/app/(afterLogin)/home/_component/PostForm";
import TabDecider from "@/app/(afterLogin)/home/_component/TabDecider";

export default function Home() {
  return (
    <main className={style.main}>
      <TabProvider>
        <Tab />
        <PostForm />
        <TabDecider />
      </TabProvider>
    </main>
  );
}
