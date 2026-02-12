import { NextRequest, NextResponse } from 'next/server';
import { getProjects, getUsers } from '@/lib/db';
import crypto from 'crypto';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await getProjects();
    const users = await getUsers();

    // Format projects with full member details
    const projectsWithMembers = projects.map((project) => {
      const members = project.members
        .map((memberId) => users.find((u) => u.id === memberId))
        .filter(Boolean)
        .map((user) => ({
          id: user!.id,
          name: user!.name,
          department: user!.department,
          role: user!.role,
        }));

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        created_at: project.createdAt.toISOString(),
        member_count: members.length,
        members,
      };
    });

    return NextResponse.json({ projects: projectsWithMembers });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, status = 'active', member_ids = [] } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      );
    }

    if (!color || typeof color !== 'string') {
      return NextResponse.json(
        { error: 'Project color is required' },
        { status: 400 }
      );
    }

    if (status !== 'active' && status !== 'archived') {
      return NextResponse.json(
        { error: 'Status must be either "active" or "archived"' },
        { status: 400 }
      );
    }

    // Check if project name already exists
    const allProjects = await getProjects();
    const existingProject = allProjects.find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    // Validate member IDs
    const validMemberIds: string[] = [];
    if (Array.isArray(member_ids) && member_ids.length > 0) {
      const users = await getUsers();
      for (const userId of member_ids) {
        if (typeof userId === 'string' && userId.trim() !== '') {
          const userExists = users.find((u) => u.id === userId.trim());
          if (userExists) {
            validMemberIds.push(userId.trim());
          }
        }
      }
    }

    // Create project using Prisma
    const { createProject } = await import('@/lib/db');
    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
      color,
      members: validMemberIds,
    });

    // Get full member details
    const users = await getUsers();
    const members = project.members
      .map((memberId) => users.find((u) => u.id === memberId))
      .filter(Boolean)
      .map((user) => ({
        id: user!.id,
        name: user!.name,
        department: user!.department,
        role: user!.role,
      }));

    return NextResponse.json(
      {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          status: project.status,
          created_at: project.createdAt.toISOString(),
          members,
          member_count: members.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
