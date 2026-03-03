"use client";

import { useState, type FormEvent } from "react";
import styles from "./commentComposer.module.css";
import { useCreateCommentMutation } from "@/store/redux/apiSlice";
import { alertForError } from "@/lib/errorMapper";

type Props = {
  postId: string;
};

export default function CommentComposer({ postId }: Props) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createComment, { isLoading }] = useCreateCommentMutation();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    setError(null);
    try {
      await createComment({ postId, content }).unwrap();
      setContent("");
    } catch (err) {
      setError(alertForError(err));
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea
        className={styles.textarea}
        rows={2}
        placeholder="Add a comment"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={isLoading || !content.trim()}>
          {isLoading ? "Posting..." : "Reply"}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
}
