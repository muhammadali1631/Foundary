import { getWorkspaceById, getWorkspaceUser } from "@/actions/workspace";
import WorkspaceClient from "@/components/WorkspaceClient";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Workspace",
  robots: {
    index: false,
    follow: false,
  },
};

interface WorkspacePageProps {
  searchParams: Promise<{
    prompt?: string;
    id?: string;
  }>;
}

const WorkspacePage = async ({
  searchParams,
}: WorkspacePageProps) => {
  const { prompt, id } = await searchParams;

  const {userId} = await auth();
  if(!userId) redirect('/');

  const user = await getWorkspaceUser();
  let workspace = null;

  if(id){
    workspace = await getWorkspaceById(id, user.id)
  }

  return (
    <WorkspaceClient workspace={workspace} initialPrompt={prompt || null} userCredits={user.credits} userId={user.id} userPlan={user.plan}/>
  );
};

export default WorkspacePage;