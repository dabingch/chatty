import Head from "next/head";
import Link from "next/link";

import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";

export const getServerSideProps = async (ctx) => {
  const { user } = await getSession(ctx.req, ctx.res);

  if (!user) {
    return {
      props: {},
    };
  }

  return {
    redirect: {
      destination: "/chat",
    },
  };
};

export default function Home() {
  const { isLoading, error, user } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div>
      <Head>
        <title>Chatty Pete - Login or Signup</title>
      </Head>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-800 text-center text-white">
        <div>
          {!user && (
            <>
              <Link
                href="/api/auth/login"
                className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
              >
                Login
              </Link>
              <Link
                href="/api/auth/signup"
                className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
              >
                Signup
              </Link>
            </>
          )}
        </div>
        <Link href="/api/auth/logout">Logout</Link>
      </div>
    </div>
  );
}
