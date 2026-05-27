"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Image, Loader2, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useCreatePost } from "@/hooks/usePosts";

export default function CreatePost() {
  const { data: session } = useSession();
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createPost = useCreatePost();

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!body.trim()) return;
    createPost.mutate(
      { body, image: image || undefined },
      {
        onSuccess: () => {
          setBody("");
          removeImage();
        },
      }
    );
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar name={session?.user?.name} image={session?.user?.image} size="md" />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          className="input resize-none flex-1"
          rows={2}
          maxLength={500}
          disabled={createPost.isPending}
        />
      </div>

      {preview && (
        <div className="relative rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost gap-1.5 text-xs py-1.5 px-2"
          >
            <Image size={16}/> Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <span>{body.length}/500</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={createPost.isPending || !body.trim()}
          className="btn-primary py-1.5 px-4 text-xs"
        >
          {createPost.isPending ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </div>
    </div>
  );
}
