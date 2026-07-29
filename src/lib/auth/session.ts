import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const getSession = cache(() => getServerSession(authOptions));

export const requireUser = cache(async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});
