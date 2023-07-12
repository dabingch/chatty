import Head from "next/head";
import Link from "next/link";

import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";

export const getServerSideProps = async (ctx) => {
  const session = await getSession(ctx.req, ctx.res);

  if (!session) {
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
              <Link href="/api/auth/login" className="btn">
                Login
              </Link>
              <Link href="/api/auth/signup" className="btn">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
