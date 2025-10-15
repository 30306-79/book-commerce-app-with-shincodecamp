"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const { status } = useSession();
  const router = useRouter();

  // すでにログイン済みなら / に退避
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  return (
    <div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにログイン
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <button
              onClick={() => signIn("github", { callbackUrl: "/" })}
              className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full"
            >
              <span>GitHubでログイン</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
