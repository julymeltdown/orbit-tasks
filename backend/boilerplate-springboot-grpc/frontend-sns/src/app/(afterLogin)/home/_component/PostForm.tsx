"use client";

import { useState } from "react";
import style from "./postForm.module.css";
import { useCreatePostMutation } from "@/store/redux/apiSlice";
import { useAuthStore } from "@/store/authStore";
import { useProfileLabel } from "@/hooks/useProfileLabel";
import { alertForError } from "@/lib/errorMapper";

export default function PostForm() {
  const userId = useAuthStore((state) => state.userId);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const { profile, avatarLabel } = useProfileLabel(userId);
  const [createPost, { isLoading }] = useCreatePostMutation();

  const avatarUrl = profile?.avatarUrl?.trim();
  const resolvedAvatar = userId ? avatarLabel : "??";

  return (
    <form
      className={style.postForm}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!content.trim()) {
          return;
        }
        try {
          await createPost({ content, visibility }).unwrap();
          setContent("");
        } catch (error) {
          alertForError(error);
        }
      }}
    >
      <div className={style.postUserSection}>
        <div className={style.postUserImage}>
          {avatarUrl ? (
            <img className={style.avatarImage} src={avatarUrl} alt="avatar" />
          ) : (
            <div className={style.avatar}>{resolvedAvatar}</div>
          )}
        </div>
      </div>
      <div className={style.postInputSection}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share an update"
        />
        <div className={style.postButtonSection}>
          <div className={style.footerButtons}>
            <div className={style.footerButtonLeft}>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="FRIENDS">FRIENDS</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </div>
            <button className={style.actionButton} disabled={!content.trim() || isLoading}>
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
